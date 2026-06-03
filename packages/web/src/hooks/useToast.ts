import { useState, useCallback, useRef } from 'react';
import type { ToastItem, ToastAction } from '@/types';

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info', action?: ToastAction, duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    const toast: ToastItem = { id, message, type, action, duration };
    setToasts((prev) => [...prev, toast]);

    const timer = window.setTimeout(() => {
      removeToast(id);
    }, duration);
    timersRef.current.set(id, timer);

    return id;
  }, [removeToast]);

  return { toasts, addToast, removeToast };
}
