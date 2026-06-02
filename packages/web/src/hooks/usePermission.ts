import { useAuth } from '@/context/AuthContext';

export function usePermission() {
  const { hasAction, hasAnyAction } = useAuth();

  return {
    can: hasAction,
    canAny: hasAnyAction,
  };
}
