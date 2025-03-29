export enum TransactionStatus {
  PENDING = 'Pending',
  SUCCESS = 'Successful',
  FAILED = 'Failed',
}

export enum TransactionType {
  CARD = 'Card',
  CRYPTO = 'Crypto',
}

export interface TransactionResponse {
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
}
