import { HttpStatus } from "@nestjs/common";

export enum TransactionStatus {
  PENDING = 'Pending',
  SUCCESS = 'Successful',
  FAILED = 'Failed',
}

export enum TransactionType {
  CARD = 'Card',
  CRYPTO = 'Crypto',
}

export type TransactionResponse = {
  success: boolean;
  statusCode: HttpStatus;
  message: string;
  data: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    eventId: string;
    id: string;
    amount: number;
    currency: string;
    transactionReference: string;
    type: TransactionType;
    gatewayReference?: string;
    paymentLink?: string;
  };
};
