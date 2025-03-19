import * as randomstring from 'randomstring';
import { uuidv7 } from 'uuidv7';

export class Utils {
  static generateDashboardCode(): string {
    return randomstring.generate({ length: 6, charset: 'alphanumeric' });
  }

  static paginateResponse<T = any>(
    data: [T[], number],
    page: number,
    take: number,
  ) {
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
}
