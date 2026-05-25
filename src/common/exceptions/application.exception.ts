export class ApplicationException extends Error {
  constructor(message: string, public statusCode: number, public options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name
    this.statusCode = statusCode;
    this.options = options;
    Error.captureStackTrace(this, this.constructor);
  }
}

