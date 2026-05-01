import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { StandardResopnse } from 'src/common';
import { RoleEnum } from 'src/common/index.enum';
import { configService } from 'src/config/config.service';
import {
  AcceptProcureeInviteDto,
  AcceptProcureeInviteSignupDto,
  CreateProcureeInviteDto,
  ProcureeInvitePreviewDto,
  ProcureeInvitePreviewQueryDto,
  ProcureeInviteResponseDto,
} from 'src/dtos/procureeInvite.dto';
import { ProcureeInvite } from 'src/entities/procureeInvite.entity';
import { GroupRepository } from 'src/repositories/group.repository';
import { ProcureeInviteRepository } from 'src/repositories/procureeInvite.repository';
import { UserRepository } from 'src/repositories/user.repositoty';
import { UserService } from './user.services';
import { TokenDto } from 'src/dtos/user.dto';

@Injectable()
export class ProcureeInviteService {
  constructor(
    private procureeInviteRepository: ProcureeInviteRepository,
    private groupRepository: GroupRepository,
    private userRepository: UserRepository,
    private userService: UserService,
  ) {}

  async createInvite(
    createProcureeInviteDto: CreateProcureeInviteDto,
    user: { groupId?: string; sub?: string; id?: string },
  ): Promise<StandardResopnse<ProcureeInviteResponseDto>> {
    const groupId = user.groupId;
    const userId = user.sub ?? user.id;

    if (!groupId || !userId) {
      throw new UnauthorizedException('Invalid Request Context');
    }

    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Tenant not found');
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const normalizedEmail = createProcureeInviteDto.email
      ? this.normalizeEmail(createProcureeInviteDto.email)
      : undefined;
    const normalizedPhone = createProcureeInviteDto.phone
      ? this.normalizePhone(createProcureeInviteDto.phone)
      : undefined;

    if (!normalizedEmail && !normalizedPhone) {
      throw new UnprocessableEntityException(
        'Provide at least an email or phone number',
      );
    }

    const expiresAt = createProcureeInviteDto.expiresAt
      ? new Date(createProcureeInviteDto.expiresAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (expiresAt.getTime() <= Date.now()) {
      throw new UnprocessableEntityException(
        'Invite expiry must be in the future',
      );
    }

    const invite = await this.procureeInviteRepository.create(
      {
        groupId,
        tokenHash,
        email: normalizedEmail,
        phone: normalizedPhone,
        expiresAt,
        createdByUserId: userId,
      },
      false,
    );

    return {
      code: 200,
      message: 'Success',
      data: {
        inviteId: invite.id,
        token,
        groupId,
        groupName: group.name,
        email: normalizedEmail,
        phone: normalizedPhone,
        inviteLink: this.buildInviteLink({
          token,
        }),
        expiresAt,
        role: RoleEnum.PROCUREE,
      },
    };
  }

  async previewInvite(
    query: ProcureeInvitePreviewQueryDto,
    user: { groupId?: string },
  ): Promise<StandardResopnse<ProcureeInvitePreviewDto | null>> {
    if (!user.groupId) {
      throw new UnauthorizedException('Invalid Request Context');
    }

    const invite = await this.getLatestInviteByRecipient(query, user.groupId);

    if (!invite) {
      return {
        code: 200,
        message: 'Success',
        data: null,
      };
    }

    return {
      code: 200,
      message: 'Success',
      data: {
        groupId: invite.groupId,
        groupName: invite.group?.name ?? '',
        email: invite.email ?? undefined,
        phone: invite.phone ?? undefined,
        expiresAt: invite.expiresAt,
        role: RoleEnum.PROCUREE,
      },
    };
  }

  async acceptInviteSignup(
    acceptInviteSignupDto: AcceptProcureeInviteSignupDto,
  ): Promise<StandardResopnse<TokenDto>> {
    const normalizedEmail = this.normalizeEmail(acceptInviteSignupDto.email);
    const normalizedPhone = this.normalizePhone(acceptInviteSignupDto.phone);
    const invite = await this.getValidInviteOrThrow(acceptInviteSignupDto.token);

    this.assertInviteRecipientMatches(invite, {
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    const existingUser = await this.userRepository.findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new UnprocessableEntityException(
        'Email already exists. Sign in to accept this invite.',
      );
    }

    const response = await this.userService.createProcureeUserFromInvite(
      {
        ...acceptInviteSignupDto,
        email: normalizedEmail,
        phone: normalizedPhone,
      },
      invite.groupId,
    );

    await this.markInviteAsUsed(invite.id, response.data.id);

    return response;
  }

  async acceptInvite(
    userId: string,
    acceptInviteDto: AcceptProcureeInviteDto,
  ): Promise<StandardResopnse<TokenDto>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invite = await this.getValidInviteOrThrow(acceptInviteDto.token);

    this.assertInviteRecipientMatches(invite, {
      email: this.normalizeEmail(user.email),
      phone: user.phone ? this.normalizePhone(user.phone) : undefined,
    });

    const response = await this.userService.addMembershipAndAuthenticate(
      userId,
      invite.groupId,
      RoleEnum.PROCUREE,
    );

    await this.markInviteAsUsed(invite.id, userId);

    return response;
  }

  private async getValidInviteOrThrow(token: string) {
    const tokenHash = this.hashToken(token);
    const invite = await this.procureeInviteRepository.findByTokenHashWithGroup(
      tokenHash,
    );

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.usedAt) {
      throw new UnprocessableEntityException('Invite has already been used');
    }

    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new UnprocessableEntityException('Invite has expired');
    }

    return invite;
  }

  private async getLatestInviteByRecipient(
    query: ProcureeInvitePreviewQueryDto,
    groupId: string,
  ) {
    const normalizedEmail = query.email
      ? this.normalizeEmail(query.email)
      : undefined;
    const normalizedPhone = query.phone
      ? this.normalizePhone(query.phone)
      : undefined;
    const invite =
      await this.procureeInviteRepository.findLatestByRecipientWithGroup(
        groupId,
        {
          email: normalizedEmail,
          phone: normalizedPhone,
        },
      );

    if (!invite) {
      return null;
    }

    if (invite.usedAt) {
      return null;
    }

    if (invite.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return invite;
  }

  private assertInviteRecipientMatches(
    invite: ProcureeInvite,
    recipient: { email?: string; phone?: string },
  ) {
    if (invite.email && invite.email !== recipient.email) {
      throw new UnauthorizedException(
        'This invite is restricted to a different email address',
      );
    }

    if (invite.phone && invite.phone !== recipient.phone) {
      throw new UnauthorizedException(
        'This invite is restricted to a different phone number',
      );
    }
  }

  private async markInviteAsUsed(inviteId: string, acceptedByUserId: string) {
    await this.procureeInviteRepository.update(inviteId, {
      acceptedByUserId,
      usedAt: new Date(),
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizePhone(phone: string) {
    return phone.trim();
  }

  private buildInviteLink(recipient: {
    token: string;
  }) {
    const inviteUrl = new URL('/accept-invite', configService.getFrontendBaseUrl());

    if (recipient.token) {
      inviteUrl.searchParams.set('token', recipient.token);
    }

    return inviteUrl.toString();
  }
}
