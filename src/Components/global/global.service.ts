import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ErrorLogs } from './entities/error-logs.entity';
import { CreateErrorLogsDto } from './dto/create-error-logs.dto';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class GlobalService {
  constructor(@InjectModel(ErrorLogs) private errorModel: typeof ErrorLogs) {}

  async logError(dto: CreateErrorLogsDto): Promise<void> {
    const { level, name, message, stack, context } = dto;

    const error = {
      level,
      name,
      message,
      stack,
      context,
    };

    console.log(error);
    await this.errorModel.create({ id: uuidv7(), ...error });
  }
}
