import * as randomstring from 'randomstring';
import { uuidv7 } from 'uuidv7';
import axios from 'axios';
import { randomInt } from 'crypto';
import * as QRCode from 'qrcode';
import slugify from 'slugify';

import { COINGECKO_BASE_PRICE_URL } from '../../Components/global/constants';
import { PaginatedResponse } from '../../Components/global/types';
import { GenerateEventUrlOptions, SendSuccessEmailOptions } from '../types';
import { InternalServerException } from '../exceptions';

export class Utils {
  static generateDashboardCode(): string {
    return randomstring.generate({ length: 8, charset: 'alphanumeric' });
  }

  static paginateResponse<T = any>(
    data: [T[], number],
    page: number,
    take: number,
  ): PaginatedResponse<T> {
    const [result, total] = data;
    const lastPage = Math.ceil(total / take);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      results: [...result],
      pageData: {
        total,
        currentPage: +page,
        nextPage,
        prevPage,
        lastPage,
      },
    };
  }

  static calcSkip(page: number, limit: number) {
    return (page - 1) * limit;
  }

  static generateTrxReference(): string {
    const timestamp = Date.now().toString().slice(-6);
    const uuidPart = uuidv7().replace(/-/g, '').slice(-12);
    const randomPart = randomstring.generate({
      length: 8,
      charset: 'alphanumeric',
      capitalization: 'uppercase',
    });

    const reference = `TicX-${uuidPart}${randomPart}${timestamp}`.slice(0, 32);
    return reference;
  }

  static async fiatToCrypto(amount: number, fiat: string): Promise<number> {
    try {
      const response = await axios.get(
        `${COINGECKO_BASE_PRICE_URL}?ids=usd-coin&vs_currencies=${fiat.toLowerCase()}`,
        {
          headers: {
            accept: 'application/json',
            'x-cg-demo-api-key': process.env.COINGECKO_API_KEY,
          },
        },
      );

      const rate: number = response.data['usd-coin'][fiat.toLowerCase()];
      return amount / rate;
    } catch (error) {
      throw error;
    }
  }

  static generateAccessCode(): string {
    return randomInt(100000, 999999).toString();
  }

  static async generateQRCode(eventUrl: string): Promise<Buffer> {
    return await QRCode.toBuffer(eventUrl);
  }

  static generateEventUrl(
    eventName: string,
    options?: GenerateEventUrlOptions,
  ): string {
    const baseUrl =
      options?.overrideBaseUrl ||
      options?.req?.headers.origin ||
      process.env.FRONTEND_BASE_URL ||
      'https://ticxpress.com';

    const slug = slugify(eventName, { lower: true, strict: true }); // removes special chars & converts to lowercase
    const prefix = options?.includeEventsPrefix === false ? '' : 'events/';
    const suffix = options?.includeDashboardSuffix === true ? '/dashboard' : '';

    return `${baseUrl}/${prefix}${slug}${suffix}`;
  }

  static async sendSuccessEmail({
    emailService,
    email,
    subject,
    htmlTemplate,
    eventUrl,
  }: SendSuccessEmailOptions): Promise<void> {
    const qrCodeBuffer = await Utils.generateQRCode(eventUrl);

    const emailResponse = await emailService.sendEmail(
      email,
      subject,
      htmlTemplate,
      [
        {
          filename: 'event_qrcode.png',
          content: qrCodeBuffer,
          contentType: 'image/png',
        },
      ],
    );

    if (!emailResponse.success) {
      throw new InternalServerException(
        'Email Error',
        'Error while sending email',
      );
    }
  }
}
