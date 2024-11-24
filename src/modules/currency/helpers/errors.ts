import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class NotSupportedCurrencyException extends HttpException {
  constructor(currency: string) {
    super(`Currency not supported: ${currency}`, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidMonobankApiSchemeException extends HttpException {
  private readonly logger = new Logger(InvalidMonobankApiSchemeException.name);

  constructor() {
    const message = `Invalid response structure from Monobank`;
    super(message, HttpStatus.BAD_GATEWAY);
    this.logger.error(message);
  }
}

export class InvalidMonobankCurrencySchemeException extends HttpException {
  private readonly logger = new Logger(InvalidMonobankCurrencySchemeException.name);

  constructor() {
    super('Invalid currency response structure from Monobank', HttpStatus.BAD_GATEWAY);
    this.logger.error('Invalid currency response structure from Monobank');
  }
}
