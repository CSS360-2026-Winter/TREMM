// src/helpers/safe.js
export function isIsoDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function parseIsoDateUtc(s) {
  // Force UTC midnight to avoid timezone weirdness
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysBetweenUtc(a, b) {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function validateTripInputs({ destination, departDate, returnDate, adults }) {
  if (!destination || typeof destination !== "string" || !destination.trim()) {
    return { ok: false, message: "Destination is required." };
  }

  if (!isIsoDate(departDate) || !isIsoDate(returnDate)) {
    return { ok: false, message: "Dates must be in YYYY-MM-DD format." };
  }

  const dep = parseIsoDateUtc(departDate);
  const ret = parseIsoDateUtc(returnDate);

  if (!dep || !ret) return { ok: false, message: "Invalid date(s) provided." };

  if (ret.getTime() <= dep.getTime()) {
    return { ok: false, message: "Return date must be after depart date." };
  }

  if (adults != null && (!Number.isInteger(adults) || adults < 1 || adults > 9)) {
    return { ok: false, message: "Adults must be an integer between 1 and 9." };
  }

  return { ok: true };
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withTimeout(promise, ms, label = "operation") {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function withRetries(taskFn, { retries = 2, baseDelayMs = 400, label = "task" } = {}) {
  let lastErr = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await taskFn({ attempt });
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const backoff = Math.min(2500, baseDelayMs * Math.pow(2, attempt));
      await sleep(backoff);
    }
  }

  throw lastErr ?? new Error(`${label} failed`);
}

export async function safeCall(name, taskFn, { timeoutMs = 12000, retries = 1 } = {}) {
  const start = Date.now();

  try {
    const data = await withRetries(
      () => withTimeout(Promise.resolve().then(taskFn), timeoutMs, name),
      { retries, label: name }
    );

    return { name, ok: true, ms: Date.now() - start, data };
  } catch (err) {
    return { name, ok: false, ms: Date.now() - start, error: err?.message ?? String(err) };
  }
}
