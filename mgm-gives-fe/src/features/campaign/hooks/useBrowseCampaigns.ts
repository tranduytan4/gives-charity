import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthUser } from '@/features/auth/hooks/useAuthUser';
import { useCategories } from '@/features/category';
import type { SortOption } from '../components';
import type { CampaignPriority, CampaignQueryParams, CampaignStatus } from '../types';
import { useInfiniteCampaignQuery } from './useCampaignQuery';

export function useBrowseCampaigns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') as SortOption | null;
  const initialSort: SortOption =
    sortParam === 'following' || sortParam === 'ending_soon' ? sortParam : 'newest';

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);

  const pageSize = 9;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();

  const queryParams = useMemo<Omit<CampaignQueryParams, 'page'>>(() => {
    const params: Omit<CampaignQueryParams, 'page'> = {
      size: pageSize,
    };

    if (debouncedSearchQuery.trim()) {
      params.keyword = debouncedSearchQuery.trim();
    }

    if (selectedCategoryIds.length > 0) {
      params.categoryId = selectedCategoryIds.join(',');
    }

    if (statusFilter !== 'ALL') {
      params.status = statusFilter as CampaignStatus;
    }

    if (priorityFilter !== 'ALL') {
      params.priority = priorityFilter as CampaignPriority;
    }

    if (sortBy === 'following') {
      params.isFollowing = true;
      params.sort = 'createdAt,desc';
    } else if (sortBy === 'ending_soon') {
      params.sort = 'endDate,asc';
    } else {
      params.sort = 'createdAt,desc'; // newest
    }

    return params;
  }, [debouncedSearchQuery, selectedCategoryIds, statusFilter, priorityFilter, sortBy]);

  const { data: user } = useAuthUser();
  const {
    data,
    isLoading: isCampaignsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCampaignQuery(queryParams);

  const campaigns = useMemo(() => {
    if (!data?.pages) return [];
    const rawCampaigns = data.pages.flatMap((page) => page.content || []);
    return rawCampaigns.filter(
      (c) =>
        ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(c.status) &&
        (!user?.id || c.creatorId !== user.id) &&
        !c.isJoined &&
        (sortBy !== 'ending_soon' || c.status !== 'COMPLETED') &&
        (sortBy !== 'following' || c.isFollowed),
    );
  }, [data?.pages, user?.id, sortBy]);

  const handleCategoryChange = (categoryIds: number[]) => {
    setSelectedCategoryIds(categoryIds);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
  };

  const handlePriorityChange = (priority: string) => {
    setPriorityFilter(priority);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setSearchParams(
      (prev) => {
        if (sort === 'newest') {
          prev.delete('sort');
        } else {
          prev.set('sort', sort);
        }
        return prev;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    const sortParam = searchParams.get('sort') as SortOption | null;
    const currentSort: SortOption =
      sortParam === 'following' || sortParam === 'ending_soon' ? sortParam : 'newest';
    if (currentSort !== sortBy) {
      setSortBy(currentSort);
    }
  }, [searchParams, sortBy]);

  const isLoading = isCampaignsLoading || isCategoriesLoading;

  return {
    searchQuery,
    setSearchQuery,
    selectedCategoryIds,
    statusFilter,
    priorityFilter,
    sortBy,
    categories,
    campaigns,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleCategoryChange,
    handleStatusChange,
    handlePriorityChange,
    handleSortChange,
  };
}
