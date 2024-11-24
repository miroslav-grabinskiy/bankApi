import { Test, TestingModule } from '@nestjs/testing';
import { ApiService } from '../api.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InvalidMonobankApiSchemeException } from '../helpers/errors';

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

describe('ApiService (Real API)', () => {
  let apiService: ApiService;
  let configService: Partial<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return '6379';
        if (key === 'CACHE_TTL') return '60';
        if (key === 'MONOBANK_API') return 'https://api.monobank.ua/bank/currency';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiService, { provide: ConfigService, useValue: configService }],
    }).compile();

    apiService = module.get<ApiService>(ApiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully fetch exchange rates from the real API', async () => {
    const apiUrl = configService.get('MONOBANK_API')!;
    const rates = await apiService.getExchangeRatesFromApi();

    // Validate the structure of the response
    expect(Array.isArray(rates)).toBe(true);
    expect(rates.length).toBeGreaterThan(0);

    rates.forEach(rate => {
      expect(rate).toHaveProperty('currencyCodeA');
      expect(rate).toHaveProperty('currencyCodeB');
      expect(rate).toHaveProperty('date');
      expect(
        (Object.prototype.hasOwnProperty.call(rate, 'rateBuy') && Object.prototype.hasOwnProperty.call(rate, 'rateSell')) ||
          Object.prototype.hasOwnProperty.call(rate, 'rateCross'),
      ).toBeTruthy();

      expect(typeof rate.currencyCodeA).toBe('number');
      expect(typeof rate.currencyCodeB).toBe('number');

      if ('rateBuy' in rate && 'rateSell' in rate) {
        expect(typeof rate.rateBuy).toBe('number');
        expect(typeof rate.rateSell).toBe('number');
      }

      if ('rateCross' in rate) {
        expect(typeof rate.rateCross).toBe('number');
      }
    });
  });

  it('should throw an InvalidMonobankApiSchemeException if the API response format is incorrect', async () => {
    jest.spyOn(axios, 'get').mockResolvedValueOnce({ data: { invalid: 'data' } });

    await expect(apiService.getExchangeRatesFromApi()).rejects.toThrow(InvalidMonobankApiSchemeException);
  });
});
