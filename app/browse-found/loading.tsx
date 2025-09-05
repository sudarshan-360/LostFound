export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header Skeleton */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Title and Search Skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="flex gap-4">
              <div className="h-10 flex-1 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
            </div>
          </div>

          {/* Items Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border p-6 space-y-4 animate-pulse">
                <div className="h-48 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-muted rounded"></div>
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-2/3 bg-muted rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-muted rounded"></div>
                  <div className="h-8 w-24 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}