import { CustomException } from './custom.exception';
import { HttpStatus } from '@nestjs/common';

export class ForbiddenException extends CustomException {
  constructor(name: string, message: string) {
    super(name, message, HttpStatus.FORBIDDEN);
  }
}
