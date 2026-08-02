export default function ProfilePageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-80 bg-muted rounded" />
      </div>

      {/* Top row: Picture card + Personal info */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        {/* Profile picture card skeleton */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center">
          <div className="w-full mb-6 space-y-2">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-3.5 w-40 bg-muted rounded" />
          </div>
          <div className="h-28 w-28 rounded-full bg-muted mb-4" />
          <div className="h-9 w-[200px] bg-muted rounded-md mb-2" />
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="w-full border-t border-border my-5" />
          <div className="space-y-2 flex flex-col items-center">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-3.5 w-40 bg-muted rounded" />
            <div className="h-3.5 w-20 bg-muted rounded" />
          </div>
        </div>

        {/* Personal info skeleton */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-2 mb-6">
            <div className="h-5 w-44 bg-muted rounded" />
            <div className="h-3.5 w-56 bg-muted rounded" />
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-11 w-full bg-muted rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-14 bg-muted rounded" />
                <div className="h-11 w-full bg-muted rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-14 bg-muted rounded" />
                <div className="h-11 w-full bg-muted rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-11 w-full bg-muted rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-10 bg-muted rounded" />
              <div className="h-24 w-full bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Password section skeleton */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-40 bg-muted rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-11 w-full bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer buttons skeleton */}
      <div className="flex justify-end gap-3 pt-2">
        <div className="h-10 w-24 bg-muted rounded-md" />
        <div className="h-10 w-36 bg-muted rounded-md" />
      </div>
    </div>
  );
}
