import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType, createClient } from 'redis';
import axios from 'axios';
import { InvalidMonobankApiSchemeException } from './helpers/errors';

@Injectable()
export class ApiService {
  private redisClient: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    console.log(this.configService.get('REDIS_HOST'), this.configService.get('REDIS_PORT'));
    this.redisClient = createClient({
      url: `redis://${this.configService.get('REDIS_HOST')}:${this.configService.get('REDIS_PORT')}`,
    });
    this.redisClient.connect();
  }

  async getExchangeRates(): Promise<IMonobankCurrencyExchange[]> {
    const cacheKey = 'exchangeRates';
    const ttl = parseInt(this.configService.get('CACHE_TTL')!, 10);

    const cachedRates = await this.redisClient.get(cacheKey);
    if (cachedRates) return JSON.parse(cachedRates) as IMonobankCurrencyExchange[];

    try {
      const rates = await this.getExchangeRatesFromApi();

      await this.redisClient.set(cacheKey, JSON.stringify(rates), { EX: ttl });

      return rates;
    } catch (error) {
      throw new HttpException('Failed to fetch exchange rates', HttpStatus.BAD_GATEWAY);
    }
  }

  async getExchangeRatesFromApi(): Promise<IMonobankCurrencyExchange[]> {
    const response = await axios.get(this.configService.get('MONOBANK_API')!);
    this.validateApiResponse(response.data);

    return response.data as unknown as IMonobankCurrencyExchange[];
  }

  validateApiResponse(data: unknown) {
    if (!Array.isArray(data)) throw new InvalidMonobankApiSchemeException();
  }
}

export interface IMonobankBaseCurrencyExchange {
  currencyCodeA: number; // Currency code A (e.g., 978 for EUR)
  currencyCodeB: number; // Currency code B (e.g., 980 for UAH)
  date: number; // Date as a Unix timestamp (e.g., 1732210573)
  rateBuy: number; // Buy exchange rate (e.g., 43.34)
  rateSell: number; // Sell exchange rate (e.g., 44.0005)
}

export interface IMonobankOtherCurrencyExchange {
  currencyCodeA: number; // Currency code A (e.g., 978 for EUR)
  currencyCodeB: number; // Currency code B (e.g., 980 for UAH)
  date: number; // Date as a Unix timestamp (e.g., 1732210573)
  rateCross: number; // exchange rate (e.g., 43.34)
}

export type IMonobankCurrencyExchange = IMonobankBaseCurrencyExchange | IMonobankOtherCurrencyExchange;
