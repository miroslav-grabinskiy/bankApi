import { Injectable } from '@nestjs/common';
import { getCodeByCurrency } from './helpers/currencyCodes.helper';
import { ApiService, IMonobankCurrencyExchange, IMonobankOtherCurrencyExchange } from './api.service';
import { NotSupportedCurrencyException, InvalidMonobankCurrencySchemeException } from './helpers/errors';

@Injectable()
export class CurrencyService {
  private readonly UAHCurrencyCode = getCodeByCurrency('UAH');

  constructor(private readonly apiService: ApiService) {}

  async convertCurrency(sourceCurrency: string, targetCurrency: string, amount: number): Promise<number> {
    const sourceCode = getCodeByCurrency(sourceCurrency);
    const targetCode = getCodeByCurrency(targetCurrency);

    if (!sourceCode) throw new NotSupportedCurrencyException(sourceCurrency);
    if (!targetCode) throw new NotSupportedCurrencyException(targetCurrency);

    const ratesList = await this.apiService.getExchangeRates();

    const pairRates = this.findRates(ratesList, sourceCode, targetCode);

    if (pairRates) {
      return this.calculateDirectConversion(pairRates, amount, sourceCode);
    } else {
      return this.calculateIndirectConversion(ratesList, amount, sourceCode, targetCode, sourceCurrency, targetCurrency);
    }
  }

  findRates(ratesList: IMonobankCurrencyExchange[], codeA: number, codeB: number) {
    return ratesList.find(rates => (rates.currencyCodeA === codeA && rates.currencyCodeB === codeB) || (rates.currencyCodeA === codeB && rates.currencyCodeB === codeA));
  }

  findRatesToUAH(ratesList: IMonobankCurrencyExchange[], code: number) {
    return ratesList.find(
      rates => (rates.currencyCodeA === code && rates.currencyCodeB === this.UAHCurrencyCode) || (rates.currencyCodeB === code && rates.currencyCodeA === this.UAHCurrencyCode),
    );
  }

  getRate(rates: IMonobankCurrencyExchange, sourceCode: number): number {
    if ('rateBuy' in rates && 'rateSell' in rates) {
      return rates.currencyCodeB === sourceCode ? rates.rateSell : rates.rateBuy;
    } else if ('rateCross' in rates) {
      return rates.rateCross;
    }
    throw new InvalidMonobankCurrencySchemeException();
  }

  calculateDirectConversion(rates: IMonobankCurrencyExchange, amount: number, sourceCode: number): number {
    const rate = this.getRate(rates, sourceCode);
    return rates.currencyCodeB === sourceCode ? amount / rate : amount * rate;
  }

  calculateIndirectConversion(
    ratesList: IMonobankCurrencyExchange[],
    amount: number,
    sourceCode: number,
    targetCode: number,
    sourceCurrency: string,
    targetCurrency: string,
  ): number {
    const sourceRatesToUAH = this.findRatesToUAH(ratesList, sourceCode);
    const targetRatesToUAH = this.findRatesToUAH(ratesList, targetCode);

    if (!sourceRatesToUAH) throw new NotSupportedCurrencyException(sourceCurrency);
    if (!targetRatesToUAH) throw new NotSupportedCurrencyException(targetCurrency);

    const amountInUAH = this.calculateDirectConversion(sourceRatesToUAH, amount, sourceCode);

    const targetRateToUAH = this.getRate(targetRatesToUAH, this.UAHCurrencyCode);

    return amountInUAH / targetRateToUAH;
  }
}
