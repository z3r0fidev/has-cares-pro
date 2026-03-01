import { IsNumber, IsString, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Star rating from 1 to 5', minimum: 1, maximum: 5, example: 5 })
  @IsNumber() @Min(1) @Max(5) rating_total!: number;

  @ApiProperty({ description: 'Review text (10–2000 characters)', minLength: 10, maxLength: 2000, example: 'Dr. Smith was incredibly kind and thorough.' })
  @IsString() @MinLength(10) @MaxLength(2000) content!: string;
}
