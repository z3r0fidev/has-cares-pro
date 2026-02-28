import { IsUUID, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export class CreateReferralDto {
  /** UUID of the provider being referred to. */
  @IsUUID()
  toProviderId!: string;

  /** UUID of the patient user being referred. */
  @IsUUID()
  patientId!: string;

  /** Optional clinical note (max 1000 chars). */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateReferralStatusDto {
  /** Only the receiving provider may accept or decline a referral. */
  @IsIn(['accepted', 'declined'])
  status!: 'accepted' | 'declined';
}
