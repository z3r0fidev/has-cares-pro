import { IsUUID, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReferralDto {
  /** UUID of the provider being referred to. */
  @ApiProperty({ description: 'UUID of the provider being referred to', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  toProviderId!: string;

  /** UUID of the patient user being referred. */
  @ApiProperty({ description: 'UUID of the patient being referred', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  patientId!: string;

  /** Optional clinical note (max 1000 chars). */
  @ApiPropertyOptional({ description: 'Optional clinical note', maxLength: 1000, example: 'Patient requires follow-up cardiology consult.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateReferralStatusDto {
  /** Only the receiving provider may accept or decline a referral. */
  @ApiProperty({ description: 'New referral status', enum: ['accepted', 'declined'], example: 'accepted' })
  @IsIn(['accepted', 'declined'])
  status!: 'accepted' | 'declined';
}
