import { HttpStatus } from '@nestjs/common';

export interface AppResponse<T extends object | null> {
  success: boolean;
  statusCode: HttpStatus;
  data: T;
  message?: string;
}

export interface ErrorData {
  name: string;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  pageData: {
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;
  };
}
