import { IsOptional, IsArray, IsIn, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { INSURANCE_PROVIDERS } from '@careequity/core';

export class UpdateProviderDto {
  @ApiPropertyOptional({ isArray: true, enum: INSURANCE_PROVIDERS, description: 'Insurance plans accepted by this provider' })
  @IsOptional()
  @IsArray()
  @IsIn(INSURANCE_PROVIDERS, { each: true })
  insurance?: string[];

  @ApiPropertyOptional({ description: 'Provider biography / practice description' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Telehealth portal URL' })
  @IsOptional()
  @IsUrl()
  telehealth_url?: string;

  @ApiPropertyOptional({ description: 'Practice website URL' })
  @IsOptional()
  @IsUrl()
  website_url?: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsOptional()
  @IsString()
  profile_image_url?: string;
}
