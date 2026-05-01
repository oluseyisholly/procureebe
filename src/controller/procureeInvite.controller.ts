import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StandardResopnse } from 'src/common';
import { RoleEnum, SwaggerApiEnumTags } from 'src/common/index.enum';
import { Public } from 'src/decorators/skipAuth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import {
  AcceptProcureeInviteDto,
  AcceptProcureeInviteSignupDto,
  CreateProcureeInviteDto,
  ProcureeInvitePreviewDto,
  ProcureeInvitePreviewQueryDto,
  ProcureeInviteResponseDto,
} from 'src/dtos/procureeInvite.dto';
import { TokenDto } from 'src/dtos/user.dto';
import { ProcureeInviteService } from 'src/services/procureeInvite.service';
import { User } from 'src/decorators/user.decoratot';

@Controller('procuree-invites')
@ApiTags(SwaggerApiEnumTags.PROCUREEINVITE)
@ApiBearerAuth()
export class ProcureeInviteController {
  constructor(private readonly procureeInviteService: ProcureeInviteService) {}

  private getAuthenticatedUserId(user: { sub?: string; id?: string }) {
    const userId = user?.sub ?? user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user id is missing');
    }

    return userId;
  }

  @Post()
  @Roles(RoleEnum.ADMIN)
  createInvite(
    @Body() createProcureeInviteDto: CreateProcureeInviteDto,
    @User() user: any,
  ): Promise<StandardResopnse<ProcureeInviteResponseDto>> {
    return this.procureeInviteService.createInvite(
      createProcureeInviteDto,
      user,
    );
  }

  @Get('preview')
  @Roles(RoleEnum.ADMIN)
  previewInvite(
    @Query() query: ProcureeInvitePreviewQueryDto,
    @User() user: any,
  ): Promise<StandardResopnse<ProcureeInvitePreviewDto | null>> {
    return this.procureeInviteService.previewInvite(query, user);
  }

  @Post('accept-signup')
  @Public()
  acceptInviteSignup(
    @Body() acceptInviteSignupDto: AcceptProcureeInviteSignupDto,
  ): Promise<StandardResopnse<TokenDto>> {
    return this.procureeInviteService.acceptInviteSignup(acceptInviteSignupDto);
  }

  @Post('accept')
  acceptInvite(
    @Body() acceptInviteDto: AcceptProcureeInviteDto,
    @User() user: { sub?: string; id?: string },
  ): Promise<StandardResopnse<TokenDto>> {
    return this.procureeInviteService.acceptInvite(
      this.getAuthenticatedUserId(user),
      acceptInviteDto,
    );
  }
}
