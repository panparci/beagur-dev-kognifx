import { User } from '@core/types';
import { useAuth } from './useAuth';

export function useRequireUser(): User {
  const { user } = useAuth();
  if (!user) {
    throw new Error('Authenticated user is required');
  }
  return user;
}
