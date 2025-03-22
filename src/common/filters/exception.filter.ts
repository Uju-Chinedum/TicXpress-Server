import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import {
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import { GlobalService } from 'src/Components/global/global.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly globalService: GlobalService) {}

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let name = 'Internal Server Error';
    let message = 'Something went wrong!! Please try again.';
    let stack = exception.stack.toString();

    if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      name = 'Not Found';
      message = 'The requested resource was not found.';
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as any;
      status = exception.getStatus();
      name = exceptionResponse.name || exception.name;
      message = exceptionResponse.message || exception.message;
    }

    if (exception instanceof UniqueConstraintError) {
      status = HttpStatus.BAD_REQUEST;
      name = 'Duplicate Entry';
      message = `The value provided for ${Object.keys(exception.fields).join(', ')} already exists.`;
    }

    if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      name = 'Validation Error';
      message = exception.errors.map((err) => err.message).join(', ');
    }

    if (exception instanceof DatabaseError) {
      status = HttpStatus.BAD_REQUEST;
      name = 'Database Error';
      message = exception.message;
    }

    if (exception instanceof ForeignKeyConstraintError) {
      status = HttpStatus.BAD_REQUEST;
      name = 'Foreign Key Constraint Error';
      message = `Invalid foreign key: ${exception.message}`;
    }

    if (axios.isAxiosError(exception) && exception.response) {
      console.log(exception.response.data)
      // status = HttpStatus.BAD_REQUEST;
      // name = 'API Error';
      // message = exception.response.data.errors[0];
    }

    let match = /at (\w+\.\w+) /;
    const context = stack.match(match);
    await this.globalService.logError({
      level: 'error',
      name,
      message,
      stack,
      context: context[1],
    });

    response.status(status).json({
      success: false,
      statusCode: status,
      data: {
        name,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
