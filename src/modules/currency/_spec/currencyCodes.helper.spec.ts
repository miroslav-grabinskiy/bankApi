import { getCodeByCurrency } from '../helpers/currencyCodes.helper'; // Adjust the import path

describe('getCodeByCurrency', () => {
  it('should return the correct code for UAH', () => {
    const code = getCodeByCurrency('UAH');
    expect(code).toBe(980); // ISO 4217 code for UAH
  });

  it('should return the correct code for EUR', () => {
    const code = getCodeByCurrency('EUR');
    expect(code).toBe(978); // ISO 4217 code for EUR
  });

  it('should return the correct code for USD', () => {
    const code = getCodeByCurrency('USD');
    expect(code).toBe(840); // ISO 4217 code for USD
  });

  it('should return undefined for an unsupported currency', () => {
    const code = getCodeByCurrency('XYZ'); // Non-existent currency
    expect(code).toBeUndefined();
  });
});
