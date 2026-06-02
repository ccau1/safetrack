/**
 * Offline Request Queue
 * Persists failed requests to localStorage and replays them when back online.
 */

export interface QueuedRequest {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  body: string | null;
  headers: Record<string, string>;
  retryCount: number;
}

const STORAGE_KEY = 'safetrack_offline_queue';
const MAX_RETRIES = 3;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): QueuedRequest {
  const item: QueuedRequest = {
    ...request,
    id: generateId(),
    timestamp: Date.now(),
    retryCount: 0,
  };
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
  return item;
}

export function dequeue(id: string): void {
  const queue = readQueue().filter((r) => r.id !== id);
  writeQueue(queue);
}

export function getQueue(): QueuedRequest[] {
  return readQueue();
}

export function clearQueue(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function incrementRetry(id: string): QueuedRequest | null {
  const queue = readQueue();
  const idx = queue.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  queue[idx].retryCount += 1;
  writeQueue(queue);
  return queue[idx];
}

export function shouldRetry(request: QueuedRequest): boolean {
  return request.retryCount < MAX_RETRIES;
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}
