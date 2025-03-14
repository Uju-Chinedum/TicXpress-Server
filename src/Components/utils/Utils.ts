import * as randomstring from 'randomstring';

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
      data: [...result],
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
}
