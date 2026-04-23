import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, TrendingDown, Users, ChevronRight } from "lucide-react";
import { Button } from "../components/Button";
import { Logo } from "../components/Logo";

const slides = [
  {
    icon: MapPin,
    title: "Find Nearby Stations",
    description: "Discover fuel stations near you with real-time prices updated by the community.",
    color: "bg-primary",
  },
  {
    icon: TrendingDown,
    title: "Compare & Save",
    description: "Compare prices across stations and find the cheapest fuel in your area.",
    color: "bg-success",
  },
  {
    icon: Users,
    title: "Community Powered",
    description: "Help others by updating fuel prices and build trust through verified contributions.",
    color: "bg-warning",
  },
];

export function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/app/map");
    }
  };

  const handleSkip = () => {
    navigate("/app/map");
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden h-screen bg-background flex flex-col">
        {/* Logo & Skip Button */}
        <div className="flex items-center justify-between p-4">
          <Logo size="sm" />
          <button
            onClick={handleSkip}
            className="text-muted-foreground text-sm font-medium"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <div className={`w-32 h-32 ${slide.color} rounded-3xl flex items-center justify-center mb-8 shadow-lg`}>
            <Icon className="w-16 h-16 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-foreground text-center mb-4">
            {slide.title}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-sm">
            {slide.description}
          </p>

          {/* Pagination Dots */}
          <div className="flex gap-2 mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="p-6 pt-0">
          <Button
            onClick={handleNext}
            fullWidth
            icon={currentSlide === slides.length - 1 ? undefined : ChevronRight}
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </Button>
        </div>
      </div>

      {/* Desktop Split Layout */}
      <div className="hidden lg:flex lg:h-screen">
        {/* Left Side - Visual/Branding Panel */}
        <div className="lg:w-1/2 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 relative overflow-hidden flex items-center justify-center p-12">
          {/* Enhanced radial glow background */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-2xl" />

          {/* Abstract decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 border-4 border-white/20 rounded-3xl rotate-12" />
          <div className="absolute bottom-32 left-16 w-24 h-24 border-4 border-white/15 rounded-2xl -rotate-12" />

          <div className="relative z-10 max-w-lg text-center">
            {/* Large Icon matching current slide */}
            <div className="w-48 h-48 bg-white/20 backdrop-blur-md rounded-[3rem] flex items-center justify-center mb-10 mx-auto shadow-2xl border-4 border-white/30">
              <Logo size="lg" />
            </div>

            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight leading-tight">
              Welcome to FuelWatch PH
            </h1>
            <p className="text-xl text-white/95 font-medium drop-shadow-lg leading-relaxed">
              Your community-powered fuel price tracking companion
            </p>
          </div>
        </div>

        {/* Right Side - Content Panel */}
        <div className="lg:w-1/2 flex items-center justify-center p-12 bg-white dark:bg-neutral-900 relative">
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-8 right-8 text-muted-foreground hover:text-foreground font-bold text-base transition-colors"
          >
            Skip
          </button>

          <div className="w-full max-w-lg">
            {/* Content Card */}
            <div className="text-center mb-10">
              <div className={`w-32 h-32 ${
                currentSlide === 0
                  ? "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50"
                  : currentSlide === 1
                  ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50"
                  : "bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-950/50 dark:to-orange-950/50"
              } rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl`}>
                <Icon className={`w-16 h-16 ${
                  currentSlide === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : currentSlide === 1
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`} strokeWidth={2.5} />
              </div>

              <h2 className="text-4xl font-bold text-foreground mb-5 tracking-tight">
                {slide.title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
                {slide.description}
              </p>
            </div>

            {/* Pagination Dots */}
            <div className="flex gap-3 mb-10 justify-center">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2.5 rounded-full transition-all ${
                    index === currentSlide
                      ? "w-12 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-lg shadow-emerald-500/40"
                      : "w-2.5 bg-gray-300 dark:bg-neutral-700"
                  }`}
                />
              ))}
            </div>

            {/* Navigation Button */}
            <div className="space-y-4">
              <Button
                onClick={handleNext}
                fullWidth
                size="lg"
                icon={currentSlide === slides.length - 1 ? undefined : ChevronRight}
              >
                {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
