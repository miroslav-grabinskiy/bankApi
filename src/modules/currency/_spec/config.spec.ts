import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    configService = module.get<ConfigService>(ConfigService); // Get instance of ConfigService
  });

  it('should check if all environment variables are loaded', () => {
    const monobankApi = configService.get('MONOBANK_API');
    const cacheTtl = configService.get('CACHE_TTL');
    const redisHost = configService.get('REDIS_HOST');
    const redisPort = configService.get('REDIS_PORT');

    expect(monobankApi).toBeDefined();
    expect(cacheTtl).toBeDefined();
    expect(redisHost).toBeDefined();
    expect(redisPort).toBeDefined();
  });
});
