import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/categoryApi';
import type { Category } from '../types';

export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
