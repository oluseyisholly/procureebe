import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { BaseFilterDto } from './baseFilter.dto';
import { Match } from 'src/decorators/match.decorator';
import { RoleEnum } from 'src/common/index.enum';

export class UserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @MinLength(7)
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginUserDto extends UserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inviteCode: string;
}

export class SignInUserDto extends UserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inviteCode?: string;
}

export class SignUpUserDto extends UserDto {
  @ApiProperty({ enum: [RoleEnum.ADMIN, RoleEnum.PATRON, RoleEnum.PROCUREE] })
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  role: RoleEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @ValidateIf((data: SignUpUserDto) => data.role === RoleEnum.ADMIN)
  @IsNotEmpty()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupDescription?: string;

  @ApiPropertyOptional()
  @ValidateIf((data: SignUpUserDto) => data.role !== RoleEnum.ADMIN)
  @IsNotEmpty()
  @IsString()
  inviteCode?: string;

  @MinLength(7)
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}

export class SignUpResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ enum: [RoleEnum.ADMIN, RoleEnum.PATRON, RoleEnum.PROCUREE] })
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  role: RoleEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inviteCode?: string;
}

export class CreateAdminUser extends UserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  groupDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @MinLength(7)
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}

export class CreateUser extends LoginUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inviteCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @MinLength(7)
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}

export class UpdateUser {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;
}

export class UserMembershipDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  membershipId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inviteCode?: string;

  @ApiProperty({ enum: [RoleEnum.ADMIN, RoleEnum.PATRON, RoleEnum.PROCUREE] })
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  role: RoleEnum;
}

export class TokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token?: string;

  @ApiProperty({ enum: [RoleEnum.ADMIN, RoleEnum.PATRON, RoleEnum.PROCUREE] })
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  role: RoleEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  membershipId: string;

  @ApiProperty({ type: [UserMembershipDto] })
  memberships: UserMembershipDto[];
}

export class UserFilterDto extends BaseFilterDto {}

export class SwitchMembershipDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  membershipId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inviteCode?: string;
}

export class JoinTenantDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inviteCode: string;

  @ApiPropertyOptional({ enum: [RoleEnum.PATRON, RoleEnum.PROCUREE] })
  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}

export class CheckAdminEmailUniqueDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}

export class CheckAdminPhoneUniqueDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class AdminUniqueCheckResponseDto {
  @ApiProperty()
  isUnique: boolean;
}
