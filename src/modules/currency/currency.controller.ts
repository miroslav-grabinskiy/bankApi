import { Controller, Post, Body } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ConvertCurrencyDto } from './dto/dto';

/**
 * Controller for handling currency conversion requests.
 */
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post('convert')
  async convertCurrency(@Body() body: ConvertCurrencyDto): Promise<number> {
    const { source, target, amount } = body;
    return this.currencyService.convertCurrency(source, target, amount);
  }
}
