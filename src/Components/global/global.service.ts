import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ErrorLogs } from './entities/error-logs.entity';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class GlobalService {
  constructor(@InjectModel(ErrorLogs) private errorModel: typeof ErrorLogs) {}

  async logError(
    level: string,
    message: string,
    stack?: string,
    context?: string,
  ): Promise<void> {
    await this.errorModel.create({
      id: uuidv7(),
      level,
      message,
      stack,
      context,
    });
  }
}
