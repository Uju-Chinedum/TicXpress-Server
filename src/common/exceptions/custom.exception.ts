import { HttpException } from '@nestjs/common';

export class CustomException extends HttpException {
  constructor(name: string, message: string, statusCode: number) {
    super({ name, message, statusCode }, statusCode);
  }
}
