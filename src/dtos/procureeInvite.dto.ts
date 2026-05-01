import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Match } from 'src/decorators/match.decorator';
import { RoleEnum } from 'src/common/index.enum';

export class CreateProcureeInviteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ProcureeInviteResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inviteId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;

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
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inviteLink: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty({ enum: [RoleEnum.PROCUREE] })
  role: RoleEnum.PROCUREE;
}

export class ProcureeInvitePreviewDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  groupName: string;

  @ApiProperty({ enum: [RoleEnum.PROCUREE] })
  role: RoleEnum.PROCUREE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  expiresAt: Date;
}

export class ProcureeInvitePreviewQueryDto {
  @ApiPropertyOptional()
  @ValidateIf((data: ProcureeInvitePreviewQueryDto) => !data.phone)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @ValidateIf((data: ProcureeInvitePreviewQueryDto) => !data.email)
  @IsNotEmpty()
  @IsString()
  phone?: string;
}

export class AcceptProcureeInviteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class AcceptProcureeInviteSignupDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;

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
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(7)
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(7)
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
