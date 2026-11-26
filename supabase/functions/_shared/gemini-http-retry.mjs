export const GEMINI_HTTP_RETRIES = 1;

const TRANSIENT_GEMINI_HTTP_STATUSES = new Set([500, 502, 503, 504]);

export function shouldRetryGeminiHttpStatus(status, retryIndex) {
  return Number.isInteger(retryIndex) &&
    retryIndex >= 0 &&
    retryIndex < GEMINI_HTTP_RETRIES &&
    TRANSIENT_GEMINI_HTTP_STATUSES.has(Number(status));
}
