import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getCategories } from '../api';
import type { AdminCategoryResponse } from '../types';

export function useCategoryQuery() {
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

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
      const params: {
        showDeleted?: boolean;
        search?: string;
        page?: number;
        size?: number;
        sort?: string;
      } = {
        page: currentPage,
        size: pageSize,
        sort: 'id,asc',
        showDeleted,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await getCategories(params);

      // If a newer request has started, discard this response
      if (currentRequest !== requestCountRef.current) return;

      if (response.success && response.result) {
        setCategories(response.result.content);
        setTotalPages(response.result.totalPages);
        setTotalElements(response.result.totalElements);
      } else {
        toast.error(response.message || 'Failed to fetch categories');
      }
    } catch (error) {
      if (currentRequest !== requestCountRef.current) return;
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      if (currentRequest === requestCountRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, showDeleted, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleShowDeletedChange = (show: boolean) => {
    setShowDeleted(show);
    setCurrentPage(0);
  };

  return {
    categories,
    isLoading,
    searchQuery,
    setSearchQuery,
    showDeleted,
    setShowDeleted: handleShowDeletedChange,
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    pageSize,
    refetch: fetchData,
  };
}
