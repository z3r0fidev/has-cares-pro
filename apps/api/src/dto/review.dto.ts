import { IsNumber, IsString, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsNumber() @Min(1) @Max(5) rating_total!: number;
  @IsString() @MinLength(10) @MaxLength(2000) content!: string;
}
