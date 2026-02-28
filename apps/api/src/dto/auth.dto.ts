import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  // 'admin' is intentionally excluded — admin accounts must be promoted server-side
  @IsOptional() @IsIn(['patient', 'provider']) role?: 'patient' | 'provider';
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}
