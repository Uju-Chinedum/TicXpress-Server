import { HttpStatus, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      process.env.OAUTH_CLIENTID,
      process.env.OAUTH_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground',
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    });
    const accessToken = oauth2Client.getAccessToken();

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        accessToken,
        tls: {
          rejectUnauthorized: false,
        },
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const mailOptions = {
        from: `"TicXpress" <${process.env.MAIL_USERNAME}>`,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Email sent',
        info,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.FAILED_DEPENDENCY,
        message: 'Email sending failed',
        error,
      };
    }
  }
}
