import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardData } from '../api/adminDashboardApi';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: getAdminDashboardData,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
