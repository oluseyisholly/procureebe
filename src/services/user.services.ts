import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { DeleteResult } from 'typeorm';
import { StandardResopnse } from 'src/common';
import { RoleEnum } from 'src/common/index.enum';
import { PaginatedRecordsDto, PaginationDto } from 'src/dtos/pagination.dto';
import {
  AdminUniqueCheckResponseDto,
  CreateAdminUser,
  CreateUser,
  JoinTenantDto,
  SignInUserDto,
  SignUpResponseDto,
  SignUpUserDto,
  SwitchMembershipDto,
  TokenDto,
  UpdateUser,
  UserFilterDto,
  UserMembershipDto,
} from 'src/dtos/user.dto';
import { AcceptProcureeInviteSignupDto } from 'src/dtos/procureeInvite.dto';
import { Group } from 'src/entities/group.entity';
import { User } from 'src/entities/user.entity';
import { UserGroup } from 'src/entities/user_group.entity';
import { GroupRepository } from 'src/repositories/group.repository';
import { UserRepository } from 'src/repositories/user.repositoty';
import { UserGroupRepository } from 'src/repositories/userGroup.repository';
import { generateInviteCode } from 'src/utils';

type MembershipSelector = {
  groupId?: string;
  inviteCode?: string;
  membershipId?: string;
};

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private userGroupRepository: UserGroupRepository,
    private groupRepository: GroupRepository,
    private jwtService: JwtService,
  ) {}

  private async signUp(
    signUpUser: SignUpUserDto,
  ): Promise<StandardResopnse<SignUpResponseDto>> {
    const allowedRoles = [RoleEnum.ADMIN, RoleEnum.PATRON, RoleEnum.PROCUREE];
    if (!allowedRoles.includes(signUpUser.role)) {
      throw new UnprocessableEntityException('Unsupported role');
    }

    await this.ensureUniqueUser(signUpUser.email, signUpUser.phone);

    const saltOrRounds = 10;
    const passwordHash = await bcrypt.hash(signUpUser.password, saltOrRounds);

    const signUpData =
      signUpUser.role === RoleEnum.ADMIN
        ? await this.createAdminAccount(signUpUser, passwordHash)
        : await this.createMemberAccount(signUpUser, passwordHash);

    return {
      data: signUpData,
      code: 200,
      message: 'Success',
    };
  }

  async createAdminUser(
    createUser: CreateAdminUser,
  ): Promise<StandardResopnse<SignUpResponseDto>> {
    return this.signUp({
      ...createUser,
      role: RoleEnum.ADMIN,
    });
  }

  async checkAdminEmailUnique(
    email: string,
  ): Promise<StandardResopnse<AdminUniqueCheckResponseDto>> {
    const existingUser = await this.userRepository.findUserByEmail(email);

    return {
      data: { isUnique: !existingUser },
      code: 200,
      message: 'Success',
    };
  }

  async checkAdminPhoneUnique(
    phone: string,
  ): Promise<StandardResopnse<AdminUniqueCheckResponseDto>> {
    const existingUser = await this.userRepository.findOne({ phone });

    return {
      data: { isUnique: !existingUser },
      code: 200,
      message: 'Success',
    };
  }

  async createUser(
    createUser: CreateUser,
  ): Promise<StandardResopnse<SignUpResponseDto>> {
    return this.signUp({
      ...createUser,
      role: RoleEnum.PATRON,
    });
  }

  async joinTenant(
    userId: string,
    joinTenantDto: JoinTenantDto,
  ): Promise<StandardResopnse<TokenDto>> {
    const membershipRole = joinTenantDto.role ?? RoleEnum.PATRON;
    if (membershipRole === RoleEnum.ADMIN) {
      throw new UnprocessableEntityException(
        'Admin memberships can only be created through admin signup',
      );
    }

    const user = await this.userRepository.findUserByIdWithMemberships(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingGroup = await this.groupRepository.findGroupByInviteCode(
      joinTenantDto.inviteCode,
    );
    if (!existingGroup) {
      throw new UnprocessableEntityException('Invalid Invite Code');
    }

    await this.assertCanAddMembership(user, membershipRole, existingGroup.id);

    await this.userRepository.transaction(async (userTxRepo) => {
      const userGroupTxRepo = userTxRepo.manager.getRepository(UserGroup);

      await userGroupTxRepo.save({
        userId: user.id,
        groupId: existingGroup.id,
        role: membershipRole,
      });

      await userTxRepo.update(user.id, {
        currentGroupId: existingGroup.id,
      });
    });

    const updatedUser = await this.loadUserWithMembershipsOrThrow(user.id);
    const activeMembership = await this.resolveMembershipForUser(updatedUser, {
      groupId: existingGroup.id,
    });

    return this.buildAuthResponse(updatedUser, activeMembership);
  }

  async switchMembership(
    userId: string,
    switchMembershipDto: SwitchMembershipDto,
  ): Promise<StandardResopnse<TokenDto>> {
    if (
      !switchMembershipDto.membershipId &&
      !switchMembershipDto.groupId &&
      !switchMembershipDto.inviteCode
    ) {
      throw new UnprocessableEntityException(
        'Provide membershipId, groupId, or inviteCode',
      );
    }

    const user = await this.loadUserWithMembershipsOrThrow(userId);
    const activeMembership = await this.resolveMembershipForUser(
      user,
      switchMembershipDto,
    );

    return this.buildAuthResponse(user, activeMembership);
  }

  async updateUser(
    id: string,
    updateUser: UpdateUser,
  ): Promise<StandardResopnse<User>> {
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('User Not found');
    }

    const updatedUser = await this.userRepository.update(id, {
      ...updateUser,
      updated_at: new Date(),
    });

    return {
      data: plainToInstance(User, updatedUser),
      code: 200,
      message: 'Success',
    };
  }

  async deleteUser(id: string): Promise<StandardResopnse<DeleteResult>> {
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('User Not found');
    }

    await this.userRepository.delete(id, true);

    return {
      data: null,
      code: 200,
      message: 'Success',
    };
  }

  async findUsers(
    paginationDto: PaginationDto,
    userFilterDto: UserFilterDto,
  ): Promise<StandardResopnse<PaginatedRecordsDto<UserGroup>>> {
    const result = await this.userGroupRepository.findAllUsers(
      paginationDto,
      userFilterDto,
    );

    return {
      data: result,
      code: 200,
      message: 'Success',
    };
  }

  async findTenantMembers(
    paginationDto: PaginationDto,
    userFilterDto: UserFilterDto,
  ): Promise<StandardResopnse<PaginatedRecordsDto<UserGroup>>> {
    return this.findUsers(paginationDto, userFilterDto);
  }

  async signIn(signInUser: SignInUserDto): Promise<StandardResopnse<TokenDto>> {
    const user = await this.userRepository.findUserByEmailWithMemberships(
      signInUser.email,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Password is not set for this account');
    }

    const isMatch = await bcrypt.compare(
      signInUser.password,
      user.passwordHash,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Incorrect Password');
    }

    const activeMembership = await this.resolveMembershipForUser(user, {
      inviteCode: signInUser.inviteCode,
    });

    return this.buildAuthResponse(user, activeMembership);
  }

  async createProcureeUserFromInvite(
    signUpUser: AcceptProcureeInviteSignupDto,
    groupId: string,
  ): Promise<StandardResopnse<TokenDto>> {
    const email = this.normalizeEmail(signUpUser.email);
    await this.ensureUniqueUser(email, signUpUser.phone);

    const passwordHash = await bcrypt.hash(signUpUser.password, 10);

    await this.userRepository.transaction(async (userTxRepo) => {
      const userGroupTxRepo = userTxRepo.manager.getRepository(UserGroup);

      const user = userTxRepo.create({
        firstName: signUpUser.firstName,
        lastName: signUpUser.lastName,
        email,
        phone: signUpUser.phone,
        passwordHash,
        currentGroupId: groupId,
      });
      const userCreated = await userTxRepo.save(user);

      await userGroupTxRepo.save({
        userId: userCreated.id,
        groupId,
        role: RoleEnum.PROCUREE,
      });
    });

    const createdUser =
      await this.userRepository.findUserByEmailWithMemberships(email);
    if (!createdUser) {
      throw new NotFoundException('User not found');
    }

    const activeMembership = await this.resolveMembershipForUser(createdUser, {
      groupId,
    });

    return this.buildAuthResponse(createdUser, activeMembership);
  }

  async addMembershipAndAuthenticate(
    userId: string,
    groupId: string,
    role: RoleEnum,
  ): Promise<StandardResopnse<TokenDto>> {
    const user = await this.loadUserWithMembershipsOrThrow(userId);
    await this.assertCanAddMembership(user, role, groupId);

    await this.userRepository.transaction(async (userTxRepo) => {
      const userGroupTxRepo = userTxRepo.manager.getRepository(UserGroup);

      await userGroupTxRepo.save({
        userId: user.id,
        groupId,
        role,
      });

      await userTxRepo.update(user.id, {
        currentGroupId: groupId,
      });
    });

    const updatedUser = await this.loadUserWithMembershipsOrThrow(user.id);
    const activeMembership = await this.resolveMembershipForUser(updatedUser, {
      groupId,
    });

    return this.buildAuthResponse(updatedUser, activeMembership);
  }

  private async ensureUniqueUser(email: string, phone: string) {
    const existingUserByEmail =
      await this.userRepository.findUserByEmail(email);
    if (existingUserByEmail) {
      throw new UnprocessableEntityException(
        'Email Address Already Exists. Sign in to join another tenant.',
      );
    }

    const existingUserByPhone = await this.userRepository.findOne({ phone });
    if (existingUserByPhone) {
      throw new UnprocessableEntityException('Phone Number Already Exists');
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async createAdminAccount(
    signUpUser: SignUpUserDto,
    passwordHash: string,
  ): Promise<SignUpResponseDto> {
    if (!signUpUser.groupName) {
      throw new UnprocessableEntityException(
        'Group Name is required for admin sign up',
      );
    }

    const inviteCode = generateInviteCode();

    return this.userRepository.transaction(async (userTxRepo) => {
      const groupTxRepo = userTxRepo.manager.getRepository(Group);
      const userGroupTxRepo = userTxRepo.manager.getRepository(UserGroup);

      const user = userTxRepo.create({
        firstName: signUpUser.firstName,
        lastName: signUpUser.lastName,
        email: signUpUser.email,
        phone: signUpUser.phone,
        passwordHash,
      });
      const userCreated = await userTxRepo.save(user);

      const group = groupTxRepo.create({
        name: signUpUser.groupName,
        description: signUpUser.groupDescription,
        inviteCode,
      });
      const groupCreated = await groupTxRepo.save(group);

      await userGroupTxRepo.save({
        userId: userCreated.id,
        groupId: groupCreated.id,
        role: RoleEnum.ADMIN,
      });

      await userTxRepo.update(userCreated.id, {
        currentGroupId: groupCreated.id,
      });

      return {
        id: userCreated.id,
        firstName: userCreated.firstName,
        lastName: userCreated.lastName,
        email: userCreated.email,
        phone: userCreated.phone,
        role: RoleEnum.ADMIN,
        groupId: groupCreated.id,
        inviteCode: groupCreated.inviteCode,
      };
    });
  }

  private async createMemberAccount(
    signUpUser: SignUpUserDto,
    passwordHash: string,
  ): Promise<SignUpResponseDto> {
    if (!signUpUser.inviteCode) {
      throw new UnprocessableEntityException(
        'Invite Code is required for user sign up',
      );
    }

    if (signUpUser.role === RoleEnum.ADMIN) {
      throw new UnprocessableEntityException(
        'Admin memberships must be created through admin signup',
      );
    }

    const existingGroup = await this.groupRepository.findGroupByInviteCode(
      signUpUser.inviteCode,
    );
    if (!existingGroup) {
      throw new UnprocessableEntityException('Invalid Invite Code');
    }

    return this.userRepository.transaction(async (userTxRepo) => {
      const userGroupTxRepo = userTxRepo.manager.getRepository(UserGroup);

      const user = userTxRepo.create({
        firstName: signUpUser.firstName,
        lastName: signUpUser.lastName,
        email: signUpUser.email,
        phone: signUpUser.phone,
        passwordHash,
        currentGroupId: existingGroup.id,
      });
      const userCreated = await userTxRepo.save(user);

      await userGroupTxRepo.save({
        userId: userCreated.id,
        groupId: existingGroup.id,
        role: signUpUser.role,
      });

      return {
        id: userCreated.id,
        firstName: userCreated.firstName,
        lastName: userCreated.lastName,
        email: userCreated.email,
        phone: userCreated.phone,
        role: signUpUser.role,
        groupId: existingGroup.id,
      };
    });
  }

  private async buildAuthResponse(
    user: User,
    activeMembership: UserGroup,
  ): Promise<StandardResopnse<TokenDto>> {
    await this.userRepository.update(user.id, {
      currentGroupId: activeMembership.groupId,
    });

    const memberships = this.sortMemberships(user.memberships).map(
      (membership) => this.toMembershipDto(membership),
    );

    const payload = {
      id: user.id,
      email: user.email,
      groupId: activeMembership.groupId,
      membershipId: activeMembership.id,
      role: activeMembership.role,
    };

    return {
      code: 200,
      message: 'success',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
        email: user.email,
        role: activeMembership.role,
        groupId: activeMembership.groupId,
        groupName: activeMembership.group?.name ?? '',
        membershipId: activeMembership.id,
        memberships,
        token: await this.jwtService.signAsync(payload),
      },
    };
  }

  private async resolveMembershipForUser(
    user: User,
    selector: MembershipSelector = {},
  ): Promise<UserGroup> {
    const memberships = this.sortMemberships(user.memberships);
    if (memberships.length === 0) {
      throw new NotFoundException('User is not linked to any tenant');
    }

    let selectedMembership: UserGroup | undefined;

    if (selector.membershipId) {
      selectedMembership = memberships.find(
        (membership) => membership.id === selector.membershipId,
      );
    } else if (selector.groupId) {
      selectedMembership = memberships.find(
        (membership) => membership.groupId === selector.groupId,
      );
    } else if (selector.inviteCode) {
      selectedMembership = memberships.find(
        (membership) => membership.group?.inviteCode === selector.inviteCode,
      );
      if (!selectedMembership) {
        const membership =
          await this.userGroupRepository.findMembershipByInviteCodeForUser(
            user.id,
            selector.inviteCode,
          );
        selectedMembership = membership ?? undefined;
      }
    } else if (user.currentGroupId) {
      selectedMembership = memberships.find(
        (membership) => membership.groupId === user.currentGroupId,
      );
    }

    if (!selectedMembership) {
      if (selector.membershipId || selector.groupId || selector.inviteCode) {
        throw new UnauthorizedException(
          'This user does not belong to the supplied tenant',
        );
      }

      selectedMembership = memberships[0];
    }

    return selectedMembership;
  }

  private async assertCanAddMembership(
    user: User,
    role: RoleEnum,
    groupId: string,
  ) {
    const memberships = this.sortMemberships(user.memberships);

    if (memberships.some((membership) => membership.groupId === groupId)) {
      throw new UnprocessableEntityException(
        'User already belongs to this tenant',
      );
    }

    const hasAdminMembership = memberships.some(
      (membership) => membership.role === RoleEnum.ADMIN,
    );

    if (role === RoleEnum.ADMIN && memberships.length > 0) {
      throw new UnprocessableEntityException(
        'Admin users can belong to only one tenant',
      );
    }

    if (hasAdminMembership) {
      throw new UnprocessableEntityException(
        'Admin users cannot join additional tenants',
      );
    }
  }

  private toMembershipDto(membership: UserGroup): UserMembershipDto {
    return {
      membershipId: membership.id,
      groupId: membership.groupId,
      groupName: membership.group?.name ?? '',
      inviteCode: membership.group?.inviteCode,
      role: membership.role,
    };
  }

  private sortMemberships(memberships: UserGroup[] = []) {
    return [...memberships].sort((left, right) => {
      const leftCreatedAt = left.created_at
        ? new Date(left.created_at).getTime()
        : 0;
      const rightCreatedAt = right.created_at
        ? new Date(right.created_at).getTime()
        : 0;

      return leftCreatedAt - rightCreatedAt;
    });
  }

  private async loadUserWithMembershipsOrThrow(userId: string) {
    const user = await this.userRepository.findUserByIdWithMemberships(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
