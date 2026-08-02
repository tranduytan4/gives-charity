export const campaignQueryKeys = {
  all: ['campaign'] as const,
  lists: ['campaigns'] as const,
  list: (params?: unknown) => ['campaigns', params] as const,
  detail: (id: number | string) => ['campaign', String(id)] as const,
  followed: ['followed-campaigns'] as const,
};
