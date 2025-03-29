export enum RegistrationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface RegistrationResponseData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  accessCode: string | null;
  createdAt: Date;
  event: {
    id: string;
    organizer: string;
    name: string;
    description: string;
    location: string;
    time: Date;
  };
  paymentLink?: string;
}
