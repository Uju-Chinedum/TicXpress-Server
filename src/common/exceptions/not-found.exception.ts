import { CustomException } from './custom.exception';
import { HttpStatus } from '@nestjs/common';

export class NotFoundException extends CustomException {
  constructor(name: string, message: string) {
    super(name, message, HttpStatus.NOT_FOUND);
  }
}
