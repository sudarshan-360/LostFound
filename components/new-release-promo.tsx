"use client";

export function NewReleasePromo() {
  return (
    <section className="mt-12 w-full">
      <div className="mx-auto max-w-4xl rounded-[40px] border border-black/5 dark:border-white/20 p-2 shadow-sm">
        <div className="relative mx-auto h-[400px] max-w-4xl overflow-hidden rounded-[38px] border border-black/5 dark:border-white/20 bg-primary p-2 shadow-sm">
          {/* Subtle radial glow from center */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255, 64, 23, 0.1), transparent 70%)",
            }}
          />

          <div className="relative z-10">
            {/* Stroked text wordmark */}
            <h1
              className="absolute inset-x-0 mt-[120px] text-center text-[100px] font-semibold text-transparent sm:mt-[30px] sm:text-[190px] pointer-events-none"
              style={{
                WebkitTextStroke: "1px currentColor",
                color: "transparent",
              }}
              aria-hidden="true"
            >
              skiper/ui
            </h1>
            <h1
              className="absolute inset-x-0 mt-[120px] text-center text-[100px] font-semibold text-primary sm:mt-[30px] sm:text-[190px] pointer-events-none"
              aria-hidden="true"
            >
              skiper/ui
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
