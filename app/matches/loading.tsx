export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center transition-all duration-300 ease-in-out">
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-primary/40 animate-pulse"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-lg font-medium animate-pulse">Loading matches...</p>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}