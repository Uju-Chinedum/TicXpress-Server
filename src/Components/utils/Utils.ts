import * as randomstring from 'randomstring';
import { uuidv7 } from 'uuidv7';
import {
  COINGECKO_BASE_PRICE_URL,
  COINGECKO_LIST_URL,
} from '../global/constants';
import axios from 'axios';

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

  private static async getCryptoId(
    crypto: string,
  ): Promise<{ id: string; symbol: string; name: string } | undefined> {
    try {
      const response = await axios.get(COINGECKO_LIST_URL, {
        headers: {
          accept: 'application/json',
          'x-cg-demo-api-key': process.env.COINGECKO_API_KEY,
        },
      });

      const id = response.data.find(
        (coin: { name: string }) => coin.name === crypto,
      );
      return id;
    } catch (error) {}
  }

  static async fiatToCrypto(
    amount: number,
    fiat: string,
    crypto: string,
  ): Promise<number> {
    try {
      const cryptoObj = await this.getCryptoId(crypto);
      const cryptoId = cryptoObj?.id;

      const response = await axios.get(
        `${COINGECKO_BASE_PRICE_URL}?ids=${cryptoId}&vs_currencies=${fiat.toLowerCase()}`,
        {
          headers: {
            accept: 'application/json',
            'x-cg-demo-api-key': process.env.COINGECKO_API_KEY,
          },
        },
      );

      const rate: number =
        response.data[crypto.toLowerCase()][fiat.toLowerCase()];
      return amount / rate;
    } catch (error) {
      throw error;
    }
  }
}
