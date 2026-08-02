import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { GetUsersParams } from '../api';
import { getUsers } from '../api';
import type { AdminUserResponse, UserRole, UserStatus } from '../types';

export function useUserQuery() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const requestCountRef = useRef(0);

  // Debounce search query to avoid spamming backend on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0); // Reset page index on search criteria change
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    const currentRequest = ++requestCountRef.current;
    setIsLoading(true);
    try {
      const params: GetUsersParams = {
        page: currentPage,
        size: pageSize,
        sort: 'id,asc',
      };

      if (roleFilter !== 'All') {
        params.roles = roleFilter;
      }

      if (statusFilter !== 'All') {
        params.statuses = statusFilter;
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await getUsers(params);

      // If a newer request has started, discard this response
      if (currentRequest !== requestCountRef.current) return;

      if (response.success && response.result) {
        setUsers(response.result.content);
        setTotalPages(response.result.totalPages);
        setTotalElements(response.result.totalElements);
      } else {
        toast.error(response.message || 'Failed to fetch users');
      }
    } catch (error) {
      if (currentRequest !== requestCountRef.current) return;
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      if (currentRequest === requestCountRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, roleFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleFilterChange = (role: UserRole | 'All') => {
    setRoleFilter(role);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (status: UserStatus | 'All') => {
    setStatusFilter(status);
    setCurrentPage(0);
  };

  return {
    users,
    isLoading,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter: handleRoleFilterChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    pageSize,
    refetch: fetchData,
  };
}
