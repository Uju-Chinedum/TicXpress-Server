import { Request } from "express";
import { EmailService } from "../utils";

export interface GenerateEventUrlOptions {
  includeEventsPrefix?: boolean;
  includeDashboardSuffix?: boolean;
  req?: Request;
  overrideBaseUrl?: string; // optional explicit override if needed
}

export interface SendSuccessEmailOptions {
  emailService: EmailService;
  email: string;
  subject: string;
  htmlTemplate: string;
  eventUrl: string;
}