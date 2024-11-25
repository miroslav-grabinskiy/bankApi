import { IsString, IsNumber, IsNotEmpty, Min, MaxLength, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for currency conversion request.
 */
export class ConvertCurrencyDto {
  @ApiProperty({
    description: 'The source currency code (e.g., USD)',
    example: 'USD',
    maxLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3, { message: 'Source currency must be at most 3 characters long.' })
  source: string;

  @ApiProperty({
    description: 'The target currency code (e.g., UAH)',
    example: 'UAH',
    maxLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3, { message: 'Target currency must be at most 3 characters long.' })
  target: string;

  @ApiProperty({
    description: 'The amount of currency to be converted',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class ConvertCurrencyByCodesDto {
  @ApiProperty({
    description: 'The source currency code',
  })
  @IsNumber()
  @IsNotEmpty()
  @Max(999)
  source: number;

  @ApiProperty({
    description: 'The target currency code',
  })
  @IsNumber()
  @IsNotEmpty()
  @Max(999)
  target: number;

  @ApiProperty({
    description: 'The amount of currency to be converted',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}
