// Kleine Helfer für parallele Abrufe mit Begrenzung.

// Führt fn für jedes Element aus, aber höchstens `limit` gleichzeitig.
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// Führt fn aus und gibt null zurück, statt zu werfen.
export async function safe<R>(fn: () => Promise<R>): Promise<R | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
