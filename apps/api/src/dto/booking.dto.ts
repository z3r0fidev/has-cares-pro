import { IsUUID, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'UUID of the provider to book with', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID() providerId!: string;

  @ApiProperty({ description: 'ISO 8601 appointment date/time', example: '2026-04-15T10:00:00Z' })
  @IsISO8601() date!: string;

  @ApiPropertyOptional({ description: 'Reason for the appointment', maxLength: 500, example: 'Annual physical' })
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
