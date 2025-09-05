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

      {/* Chat Interface Skeleton */}
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Chat List Sidebar Skeleton */}
        <div className="w-80 border-r bg-muted/20 p-4 space-y-4">
          <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded"></div>
                  <div className="h-3 w-1/2 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window Skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header Skeleton */}
          <div className="border-b p-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
            </div>
          </div>

          {/* Messages Area Skeleton */}
          <div className="flex-1 p-4 space-y-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-xs p-3 rounded-lg space-y-2 animate-pulse ${
                  i % 2 === 0 ? 'bg-muted' : 'bg-primary/20'
                }`}>
                  <div className="h-4 w-full bg-muted-foreground/20 rounded"></div>
                  <div className="h-4 w-3/4 bg-muted-foreground/20 rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Skeleton */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <div className="flex-1 h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}