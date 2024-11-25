import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from '../currency.service';
import { ApiService, IMonobankBaseCurrencyExchange, IMonobankCurrencyExchange, IMonobankOtherCurrencyExchange } from '../api.service';
import { NotSupportedCurrencyException, InvalidMonobankCurrencySchemeException } from '../helpers/errors';

const mockRates = [
  {
    currencyCodeA: 840,
    currencyCodeB: 980,
    date: 1732312873,
    rateBuy: 41.15,
    rateSell: 41.6493,
  },
  {
    currencyCodeA: 978,
    currencyCodeB: 980,
    date: 1732345573,
    rateBuy: 42.9,
    rateSell: 43.5996,
  },
  {
    currencyCodeA: 978,
    currencyCodeB: 840,
    date: 1732345573,
    rateBuy: 1.036,
    rateSell: 1.05,
  },
  {
    currencyCodeA: 826,
    currencyCodeB: 980,
    date: 1732396845,
    rateCross: 52.515,
  },
  {
    currencyCodeA: 392,
    currencyCodeB: 980,
    date: 1732396837,
    rateCross: 0.2705,
  },
  {
    currencyCodeA: 970,
    currencyCodeB: 980,
    date: 1732396837,
    rate: 0.2705,
  },
];
// Mock ApiService
const mockApiService = {
  getExchangeRates: jest.fn().mockResolvedValue(mockRates),
};

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrencyService, { provide: ApiService, useValue: mockApiService }],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  //P.S at start - currency service had only convertCurrency Method!
  describe('convertCurrency', () => {
    it('should convert currency with direct rates USD to UAH', async () => {
      const result = await service.convertCurrency('USD', 'UAH', 100);
      expect(result).toBeCloseTo(100 * 41.15);
    });

    it('should convert currency with direct rates UAH to USD', async () => {
      const result = await service.convertCurrency('UAH', 'USD', 100);
      expect(result).toBeCloseTo(2.401);
    });

    it('should convert currency with direct rates JPY to UAH', async () => {
      const result = await service.convertCurrency('JPY', 'UAH', 100);
      expect(result).toBeCloseTo(27.05);
    });

    it('should convert currency with direct rates UAH to JPY', async () => {
      const result = await service.convertCurrency('UAH', 'JPY', 100);
      expect(result).toBeCloseTo(100 / 0.2705);
    });

    it('should convert currency with direct rates USD to JPY', async () => {
      const result = await service.convertCurrency('USD', 'JPY', 100);
      expect(result).toBeCloseTo((100 * 41.15) / 0.2705);
    });

    it('should convert currency with direct rates JPY to USD', async () => {
      const result = await service.convertCurrency('JPY', 'USD', 100);
      expect(result).toBeCloseTo((100 * 0.2705) / 41.6493);
    });

    it('should convert currency with direct rates JPY to GBP', async () => {
      const result = await service.convertCurrency('JPY', 'GBP', 100);
      expect(result).toBeCloseTo((100 * 0.2705) / 52.515);
    });

    it('should convert currency with direct rates GBP to JPY', async () => {
      const result = await service.convertCurrency('GBP', 'JPY', 100);
      expect(result).toBeCloseTo((100 * 52.515) / 0.2705);
    });

    it('should throw NotSupportedCurrencyException for unsupported currencies', async () => {
      await expect(service.convertCurrency('XYZ', 'JPY', 100)).rejects.toThrow(NotSupportedCurrencyException);
    });

    it('should throw InvalidMonobankCurrencySchemeException for missing rateCross', async () => {
      await expect(service.convertCurrency('USD', 'COU', 100)).rejects.toThrow(InvalidMonobankCurrencySchemeException);
    });
  });

  describe('getRate', () => {
    it('should return the correct rate based on the source currency code', () => {
      const rates = { currencyCodeA: 840, currencyCodeB: 980, rateBuy: 41.15, rateSell: 41.6493 } as IMonobankBaseCurrencyExchange;

      const rate = service.getRate(rates, 840);
      expect(rate).toBe(41.15); // The `rateBuy` for USD to UAH
    });

    it('should return the cross rate if no buy/sell rate is available', () => {
      const rates = { currencyCodeA: 840, currencyCodeB: 392, rateCross: 0.2705 } as IMonobankOtherCurrencyExchange;

      const rate = service.getRate(rates, 840);
      expect(rate).toBe(0.2705); // Cross rate should be returned
    });

    it('should throw InvalidMonobankApiSchemeException if the rate is missing', () => {
      const rates = { currencyCodeA: 840, currencyCodeB: 980 } as IMonobankCurrencyExchange;

      expect(() => service.getRate(rates, 840)).toThrowError(InvalidMonobankCurrencySchemeException);
    });
  });

  describe('findRates', () => {
    it('should find rates when the source and target currencies match directly', () => {
      const ratesList: IMonobankCurrencyExchange[] = [
        { currencyCodeA: 840, currencyCodeB: 980, rateBuy: 41.15, rateSell: 41.6493, date: 1732312873 },
        { currencyCodeA: 978, currencyCodeB: 980, rateBuy: 42.9, rateSell: 43.5996, date: 1732345573 },
      ];

      const result = service.findRates(ratesList, 840, 980);
      expect(result).toEqual(ratesList[0]); // Matches the first entry
    });

    it('should find rates when source and target currencies are swapped', () => {
      const ratesList: IMonobankCurrencyExchange[] = [
        { currencyCodeA: 978, currencyCodeB: 980, rateBuy: 42.9, rateSell: 43.5996, date: 1732345573 },
        { currencyCodeA: 980, currencyCodeB: 840, rateBuy: 41.15, rateSell: 41.6493, date: 1732312873 },
      ];

      const result = service.findRates(ratesList, 840, 980);
      expect(result).toEqual(ratesList[1]); // Matches the second entry due to reversed codes
    });

    it('should return undefined if no matching rates are found', () => {
      const ratesList: IMonobankCurrencyExchange[] = [{ currencyCodeA: 978, currencyCodeB: 980, rateBuy: 42.9, rateSell: 43.5996, date: 1732345573 }];

      const result = service.findRates(ratesList, 840, 392); // No match for 840 <-> 392
      expect(result).toBeUndefined();
    });
  });

  describe('findRatesToUAH', () => {
    it('should find rates when source currency is UAH', () => {
      const ratesList: IMonobankCurrencyExchange[] = [
        { currencyCodeA: 840, currencyCodeB: 980, rateBuy: 41.15, rateSell: 41.6493, date: 1732312873 },
        { currencyCodeA: 978, currencyCodeB: 840, rateBuy: 1.1, rateSell: 1.2, date: 1732345573 },
      ];

      const result = service.findRatesToUAH(ratesList, 840);
      expect(result).toEqual(ratesList[0]); // Matches the first entry where UAH is target
    });

    it('should find rates when target currency is UAH', () => {
      const ratesList: IMonobankCurrencyExchange[] = [
        { currencyCodeA: 978, currencyCodeB: 980, rateBuy: 42.9, rateSell: 43.5996, date: 1732345573 },
        { currencyCodeA: 980, currencyCodeB: 392, rateCross: 0.2705, date: 1732396837 },
      ];

      const result = service.findRatesToUAH(ratesList, 392);
      expect(result).toEqual(ratesList[1]); // Matches the second entry where UAH is source
    });

    it('should return undefined if no rates to UAH are found', () => {
      const ratesList: IMonobankCurrencyExchange[] = [{ currencyCodeA: 978, currencyCodeB: 840, rateBuy: 1.1, rateSell: 1.2, date: 1732345573 }];

      const result = service.findRatesToUAH(ratesList, 392); // No match involving UAH
      expect(result).toBeUndefined();
    });
  });
});
