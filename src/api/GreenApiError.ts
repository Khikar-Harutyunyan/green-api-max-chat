import type { QuotaDetails, QuotaExceededResponse } from './types';

export interface SerializedGreenApiError {
  status: number;
  method: string;
  payload: string;
  message: string;
  name: 'GreenApiError';
}

export class GreenApiError extends Error {
  readonly status: number;
  readonly method: string;
  readonly payload: string;

  constructor(method: string, status: number, payload: string, message?: string) {
    super(message ?? `${method} failed with HTTP ${status}`);
    this.name = 'GreenApiError';
    this.status = status;
    this.method = method;
    this.payload = payload;
  }

  static from(error: unknown): GreenApiError | undefined {
    if (error instanceof GreenApiError) return error;
    if (typeof error !== 'object' || error === null) return undefined;
    const candidate = error as Partial<SerializedGreenApiError>;
    if (candidate.name !== 'GreenApiError' || typeof candidate.status !== 'number') return undefined;
    return new GreenApiError(
      candidate.method ?? '',
      candidate.status,
      candidate.payload ?? '',
      candidate.message,
    );
  }

  serialize(): SerializedGreenApiError {
    const { status, method, payload, message } = this;
    return { name: 'GreenApiError', status, method, payload, message };
  }

  get isUnreachable(): boolean {
    return this.status === 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isQuotaExceeded(): boolean {
    return this.status === 466;
  }

  get isChatLimitReached(): boolean {
    return this.quota?.status === 'CORRESPONDENTS_QUOTA_EXCEEDED';
  }

  get isThrottled(): boolean {
    return this.status === 429;
  }

  get isRateLimited(): boolean {
    return this.status === 469;
  }

  get quota(): QuotaDetails | undefined {
    if (!this.isQuotaExceeded) return undefined;
    try {
      const body = JSON.parse(this.payload) as QuotaExceededResponse | null;
      return body?.invokeStatus ?? body?.quotaData;
    } catch {
      return undefined;
    }
  }
}
