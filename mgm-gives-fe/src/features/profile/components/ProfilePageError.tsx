import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

interface ProfilePageErrorProps {
  onRetry: () => void;
}

export default function ProfilePageError({ onRetry }: ProfilePageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-5">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Failed to load profile</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        We couldn't load your profile information. Please check your connection and try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="cursor-pointer">
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
