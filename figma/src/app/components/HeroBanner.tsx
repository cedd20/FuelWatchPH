interface HeroBannerProps {
  onClick?: () => void;
}

export function HeroBanner({ onClick }: HeroBannerProps) {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02] cursor-pointer group">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />

      {/* Subtle glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

      {/* Gas Station Image */}
      <div className="absolute inset-0 flex items-end justify-center pb-8 opacity-90">
        <div className="relative w-full h-48 perspective-1000">
          <img
            src="https://images.unsplash.com/photo-1710172510070-9c130a9a310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            alt="Modern Gas Station"
            className="w-full h-full object-cover object-center opacity-60 group-hover:opacity-70 transition-opacity duration-500 mix-blend-overlay"
            style={{
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)',
            }}
          />
        </div>
      </div>

      {/* Glass Card Content */}
      <div className="relative z-10 p-8 min-h-[280px] flex flex-col justify-end">
        {/* Main Content */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-white drop-shadow-2xl leading-tight">
            Save more on fuel
          </h2>
          <p className="text-white/90 text-sm font-medium drop-shadow-lg max-w-xs">
            Get exclusive discounts and cashback on every fill-up at partner stations
          </p>
        </div>
      </div>

      {/* Subtle border glow */}
      <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-white/20 transition-colors pointer-events-none" />
    </div>
  );
}
