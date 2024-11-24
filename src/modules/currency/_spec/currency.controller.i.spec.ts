import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyController } from '../currency.controller';
import { CurrencyService } from '../currency.service';
import { NotSupportedCurrencyException } from '../helpers/errors';

const mockCurrencyService = {
  convertCurrency: jest.fn(),
};

describe('CurrencyController', () => {
  let controller: CurrencyController;
  let currencyService: CurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrencyController],
      providers: [{ provide: CurrencyService, useValue: mockCurrencyService }],
    }).compile();

    controller = module.get<CurrencyController>(CurrencyController);
    currencyService = module.get<CurrencyService>(CurrencyService);
  });

  describe('convertCurrency', () => {
    it('should convert currency successfully', async () => {
      const mockRequest = { source: 'USD', target: 'EUR', amount: 100 };
      const mockResponse = 85; // Mock the expected result from the service

      // Mock the service method
      mockCurrencyService.convertCurrency.mockResolvedValue(mockResponse);

      const result = await controller.convertCurrency(mockRequest);

      expect(result).toBe(mockResponse);
      expect(currencyService.convertCurrency).toHaveBeenCalledWith('USD', 'EUR', 100);
    });

    it('should throw NotSupportedCurrencyException for unsupported currency', async () => {
      const mockRequest = { source: 'XYZ', target: 'USD', amount: 100 };

      mockCurrencyService.convertCurrency.mockRejectedValue(new NotSupportedCurrencyException('XYZ'));

      await expect(controller.convertCurrency(mockRequest)).rejects.toThrowError(NotSupportedCurrencyException);
    });
  });
});
