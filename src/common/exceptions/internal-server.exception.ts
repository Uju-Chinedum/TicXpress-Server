import { CustomException } from './custom.exception';
import { HttpStatus } from '@nestjs/common';

export class InternalServerException extends CustomException {
  constructor(name: string, message: string) {
    super(name, message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
