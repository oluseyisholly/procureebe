import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoleEnum, SwaggerApiEnumTags } from '../common/index.enum';
import {
  AdminUniqueCheckResponseDto,
  CheckAdminEmailUniqueDto,
  CheckAdminPhoneUniqueDto,
  CreateAdminUser,
  CreateUser,
  JoinTenantDto,
  SignInUserDto,
  SignUpResponseDto,
  SwitchMembershipDto,
  TokenDto,
  UpdateUser,
  UserFilterDto,
} from 'src/dtos/user.dto';
import { UserService } from 'src/services/user.services';
import { PaginatedRecordsDto, PaginationDto } from 'src/dtos/pagination.dto';
import { User } from 'src/entities/user.entity';
import { StandardResopnse } from 'src/common';
import { Public } from 'src/decorators/skipAuth.decorator';
import { DeleteResult } from 'typeorm';
import { Roles } from 'src/decorators/roles.decorator';
import { UserGroup } from 'src/entities/user_group.entity';
import { Request as ExpressRequest } from 'express';

@Controller('user')
@ApiTags(SwaggerApiEnumTags.USER)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  private getAuthenticatedUserId(request: ExpressRequest & {
    user: { sub?: string; id?: string };
  }) {
    const userId = request.user?.sub ?? request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user id is missing');
    }

    return userId;
  }

  @Post()
  @Public()
  createUser(
    @Body() creatUser: CreateUser,
  ): Promise<StandardResopnse<SignUpResponseDto>> {
    return this.userService.createUser(creatUser);
  }

  @Post('/admin')
  @Public()
  createAdmin(
    @Body() createAdminUser: CreateAdminUser,
  ): Promise<StandardResopnse<SignUpResponseDto>> {
    return this.userService.createAdminUser(createAdminUser);
  }

  @Get('/admin/check-email')
  @Public()
  checkAdminEmailUnique(
    @Query() query: CheckAdminEmailUniqueDto,
  ): Promise<StandardResopnse<AdminUniqueCheckResponseDto>> {
    return this.userService.checkAdminEmailUnique(query.email);
  }

  @Get('/admin/check-phone')
  @Public()
  checkAdminPhoneUnique(
    @Query() query: CheckAdminPhoneUniqueDto,
  ): Promise<StandardResopnse<AdminUniqueCheckResponseDto>> {
    return this.userService.checkAdminPhoneUnique(query.phone);
  }

  @Post('signin')
  @Public()
  signIn(
    @Body() signInUserDto: SignInUserDto,
  ): Promise<StandardResopnse<TokenDto>> {
    return this.userService.signIn(signInUserDto);
  }

  @Post('join-tenant')
  joinTenant(
    @Req() request: ExpressRequest & { user: { sub?: string; id?: string } },
    @Body() joinTenantDto: JoinTenantDto,
  ): Promise<StandardResopnse<TokenDto>> {
    return this.userService.joinTenant(
      this.getAuthenticatedUserId(request),
      joinTenantDto,
    );
  }

  @Post('switch-membership')
  switchMembership(
    @Req() request: ExpressRequest & { user: { sub?: string; id?: string } },
    @Body() switchMembershipDto: SwitchMembershipDto,
  ): Promise<StandardResopnse<TokenDto>> {
    return this.userService.switchMembership(
      this.getAuthenticatedUserId(request),
      switchMembershipDto,
    );
  }

  @Patch(':id')
  updateUser(
    @Body() updateUser: UpdateUser,
    @Param('id') id: string,
  ): Promise<StandardResopnse<User>> {
    return this.userService.updateUser(id, updateUser);
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  deleteUser(@Param('id') id: string): Promise<StandardResopnse<DeleteResult>> {
    return this.userService.deleteUser(id);
  }

  @Get()
  @Roles(RoleEnum.ADMIN)
  async findUsers(
    @Query() paginationDto: PaginationDto,
    @Query() userFilterDto: UserFilterDto,
  ): Promise<StandardResopnse<PaginatedRecordsDto<UserGroup>>> {
    return this.userService.findUsers(paginationDto, userFilterDto);
  }

  @Get('members')
  @Roles(RoleEnum.ADMIN)
  async findTenantMembers(
    @Query() paginationDto: PaginationDto,
    @Query() userFilterDto: UserFilterDto,
  ): Promise<StandardResopnse<PaginatedRecordsDto<UserGroup>>> {
    return this.userService.findTenantMembers(paginationDto, userFilterDto);
  }
}
