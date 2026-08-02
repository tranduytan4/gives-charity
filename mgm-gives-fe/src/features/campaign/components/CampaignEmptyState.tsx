import { SearchX } from 'lucide-react';

interface CampaignEmptyStateProps {
  title?: string;
  message?: string;
}

export function CampaignEmptyState({
  title = 'No campaigns found',
  message = "Try adjusting your search or filters to find what you're looking for.",
}: CampaignEmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
          <SearchX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
