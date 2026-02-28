import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsIn(['patient', 'provider', 'admin']) role?: 'patient' | 'provider' | 'admin';
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}
