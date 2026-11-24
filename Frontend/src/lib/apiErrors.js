/**
 * Pull the first message per field out of a Laravel 422 error.
 * Returns {} for anything that isn't a validation error.
 */
export function getFieldErrors(error) {
  if (error?.response?.status !== 422) return {};
  const errors = error.response.data?.errors ?? {};
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, [].concat(messages)[0]]),
  );
}

/**
 * { status, code, retryAfter, attemptsLeft } from an API error; status is undefined for network errors.
 * `code` is the machine-readable reason, e.g. 'code_expired' or 'consent_required'.
 */
export function getErrorInfo(error) {
  const response = error?.response;
  const data = response?.data ?? {};
  return {
    status: response?.status,
    code: data.code,
    retryAfter: data.retry_after,
    attemptsLeft: data.attempts_left,
  };
}
