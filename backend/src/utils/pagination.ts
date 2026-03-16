export interface PaginationParams {
  pageToken?: string;
  maxResults: number;
}

export function buildPaginationParams(
  pageToken?: string,
  maxResults = 20,
): PaginationParams {
  return {
    ...(pageToken ? { pageToken } : {}),
    maxResults,
  };
}
