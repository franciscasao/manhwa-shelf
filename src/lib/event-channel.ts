import type { EventEmitter } from "events";

/**
 * Bridges EventEmitter events into an async generator using a push-queue.
 * Yields each event payload of type T, and terminates when a done event fires,
 * the signal aborts, or the consumer breaks out of the loop.
 */
export async function* eventChannel<T>(opts: {
  emitter: EventEmitter;
  events: string[];
  doneEvents?: string[];
  signal?: AbortSignal;
}): AsyncGenerator<T> {
  const { emitter, events, doneEvents = [], signal } = opts;

  const queue: T[] = [];
  let resolve: (() => void) | null = null;
  let done = false;

  const onEvent = (value: T) => {
    queue.push(value);
    resolve?.();
  };

  const onDone = () => {
    done = true;
    resolve?.();
  };

  for (const name of events) emitter.on(name, onEvent);
  for (const name of doneEvents) emitter.on(name, onDone);

  signal?.addEventListener("abort", onDone, { once: true });

  try {
    while (!done && !signal?.aborted) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else {
        await new Promise<void>((r) => {
          resolve = r;
        });
        resolve = null;
      }
    }
    // Drain remaining items
    while (queue.length > 0) {
      yield queue.shift()!;
    }
  } finally {
    for (const name of events) emitter.off(name, onEvent);
    for (const name of doneEvents) emitter.off(name, onDone);
  }
}
