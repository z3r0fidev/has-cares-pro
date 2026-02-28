import { IsUUID, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID() providerId!: string;
  @IsISO8601() date!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
