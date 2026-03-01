import { IsString, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckEligibilityDto {
  @ApiProperty({ description: 'Insurance member ID', example: 'MBR-12345678' })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ description: 'Member date of birth (YYYY-MM-DD)', example: '1985-07-22' })
  @IsDateString()
  memberDob!: string;

  @ApiProperty({ description: 'Insurance plan code', example: 'BCBS-PPO' })
  @IsString()
  @IsNotEmpty()
  insurancePlanCode!: string;

  @ApiProperty({ description: '10-digit NPI of the provider', example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  providerNpi!: string;
}
