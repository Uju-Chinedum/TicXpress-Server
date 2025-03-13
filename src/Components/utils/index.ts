import * as randomstring from 'randomstring';

export class Utils {
  static generateDashboardCode(): string {
    return randomstring.generate({ length: 6, charset: 'alphanumeric' });
  }
}
