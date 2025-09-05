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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back Button Skeleton */}
          <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>

          {/* Item Details Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Skeleton */}
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Details Skeleton */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
                <div className="h-6 w-1/2 bg-muted rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-4/5 bg-muted rounded animate-pulse"></div>
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="space-y-3">
                <div className="h-12 w-full bg-muted rounded animate-pulse"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </div>
              </div>

              {/* Additional Info Skeleton */}
              <div className="space-y-4">
                <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}