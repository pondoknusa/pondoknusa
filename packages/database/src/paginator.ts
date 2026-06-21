export interface PaginatorMeta {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  from: number | null;
  to: number | null;
}

export interface PaginatedResponse<T> extends PaginatorMeta {
  data: T[];
}

export class LengthAwarePaginator<T> {
  constructor(
    public readonly items: T[],
    public readonly total: number,
    public readonly perPage: number,
    public readonly currentPage: number,
  ) {}

  static resolvePage(page?: number | string | null, defaultPage = 1): number {
    const parsed = Number(page);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return defaultPage;
    }
    return Math.floor(parsed);
  }

  static resolvePerPage(
    perPage?: number | string | null,
    defaultPerPage = 15,
    maxPerPage = 100,
  ): number {
    const parsed = Number(perPage);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return defaultPerPage;
    }
    return Math.min(Math.floor(parsed), maxPerPage);
  }

  get lastPage(): number {
    if (this.total === 0) {
      return 1;
    }
    return Math.ceil(this.total / this.perPage);
  }

  get from(): number | null {
    if (this.items.length === 0) {
      return null;
    }
    return (this.currentPage - 1) * this.perPage + 1;
  }

  get to(): number | null {
    if (this.items.length === 0) {
      return null;
    }
    return (this.currentPage - 1) * this.perPage + this.items.length;
  }

  hasMorePages(): boolean {
    return this.currentPage < this.lastPage;
  }

  onFirstPage(): boolean {
    return this.currentPage <= 1;
  }

  onLastPage(): boolean {
    return this.currentPage >= this.lastPage;
  }

  meta(): PaginatorMeta {
    return {
      currentPage: this.currentPage,
      perPage: this.perPage,
      total: this.total,
      lastPage: this.lastPage,
      from: this.from,
      to: this.to,
    };
  }

  toArray(): PaginatedResponse<T> {
    return {
      data: this.items,
      ...this.meta(),
    };
  }

  toJSON(): PaginatedResponse<T> {
    return this.toArray();
  }
}