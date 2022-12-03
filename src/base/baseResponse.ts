export interface BaseResponse {
  data?: any;

  error?: {
    message: string;
    data?: any;
  };
}

export interface PagingResponse extends BaseResponse {
  metadata: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class ApiError extends Error {
  status: number;
  error: any;

  constructor(message: string, status: number, error?: any) {
    super(message);
    this.status = status;
    this.error = error;
  }
}
