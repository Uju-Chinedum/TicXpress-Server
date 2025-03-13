import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let name = 'Internal Server Error';
    let message = 'Something went wrong!! Please try again.';

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

    response.status(status).json({
      statusCode: status,
      name,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
