import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'patient@example.com' })
  @IsEmail() email!: string;

  @ApiProperty({ description: 'Password (minimum 8 characters)', example: 'SecureP@ss1' })
  @IsString() @MinLength(8) password!: string;

  // 'admin' is intentionally excluded — admin accounts must be promoted server-side
  @ApiPropertyOptional({ description: 'Account role', enum: ['patient', 'provider'], example: 'patient' })
  @IsOptional() @IsIn(['patient', 'provider']) role?: 'patient' | 'provider';
}

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'patient@example.com' })
  @IsEmail() email!: string;

  @ApiProperty({ description: 'Account password', example: 'SecureP@ss1' })
  @IsString() password!: string;
}
