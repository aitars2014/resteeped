const DEFAULT_RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRetryAfter(value) {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const retryAt = Date.parse(value);
  if (Number.isFinite(retryAt)) {
    return Math.max(0, retryAt - Date.now());
  }

  return null;
}

function timeoutSignal(timeoutMs) {
  if (!timeoutMs) return undefined;
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  const {
    retries = 4,
    baseDelayMs = 2000,
    maxDelayMs = 60000,
    timeoutMs = 30000,
    label = url,
    retryStatuses = DEFAULT_RETRY_STATUSES,
  } = retryOptions;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || timeoutSignal(timeoutMs),
      });

      if (response.ok || !retryStatuses.has(response.status) || attempt === retries) {
        return response;
      }

      const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
      const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const jitter = Math.floor(Math.random() * Math.min(1000, exponentialDelay));
      const delayMs = retryAfterMs ?? exponentialDelay + jitter;

      console.warn(
        `  ${label}: HTTP ${response.status}; retrying in ${Math.round(delayMs / 1000)}s ` +
        `(${attempt + 1}/${retries})`
      );
      await sleep(delayMs);
    } catch (error) {
      lastError = error;

      if (attempt === retries || error.name === 'AbortError') {
        throw error;
      }

      const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const jitter = Math.floor(Math.random() * Math.min(1000, exponentialDelay));
      const delayMs = exponentialDelay + jitter;
      console.warn(
        `  ${label}: ${error.message}; retrying in ${Math.round(delayMs / 1000)}s ` +
        `(${attempt + 1}/${retries})`
      );
      await sleep(delayMs);
    }
  }

  throw lastError || new Error(`Failed to fetch ${label}`);
}

module.exports = {
  fetchWithRetry,
  sleep,
};
