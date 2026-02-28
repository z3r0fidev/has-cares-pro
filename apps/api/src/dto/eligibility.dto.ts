import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CheckEligibilityDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @IsDateString()
  memberDob!: string;

  @IsString()
  @IsNotEmpty()
  insurancePlanCode!: string;

  @IsString()
  @IsNotEmpty()
  providerNpi!: string;
}
