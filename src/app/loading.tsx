export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="w-full px-4 py-3 flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="h-11 flex-1 max-w-3xl rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
      </header>

      {/* Grid skeleton */}
      <main className="w-full px-4 py-6 pb-28">
        <div className="max-w-[1800px] mx-auto">
          <div className="h-4 w-40 bg-muted rounded animate-pulse mb-4" />
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
            {[280, 200, 320, 180, 260, 220, 300, 190, 240, 210, 280, 170].map(
              (height, i) => (
                <div
                  key={i}
                  className="mb-4 rounded-2xl bg-muted animate-pulse break-inside-avoid"
                  style={{ height }}
                />
              ),
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
