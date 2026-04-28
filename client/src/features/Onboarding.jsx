import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, TrendingDown, Users, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { Logo } from "@/shared/components/Logo";

const slides = [
  {
    icon: MapPin,
    title: "Find Nearby Stations",
    description: "Discover fuel stations near you with real-time prices updated by the community.",
    color: "bg-emerald-600",
  },
  {
    icon: TrendingDown,
    title: "Compare & Save",
    description: "Compare prices across stations and find the cheapest fuel in your area.",
    color: "bg-teal-600",
  },
  {
    icon: Users,
    title: "Community Powered",
    description: "Help others by updating fuel prices and build trust through verified contributions.",
    color: "bg-green-600",
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
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <div className="flex items-center justify-between p-6">
        <Logo size="sm" />
        <button onClick={handleSkip} className="text-gray-500 font-bold">Skip</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className={`w-32 h-32 ${slide.color} rounded-3xl flex items-center justify-center mb-10 shadow-2xl`}>
          <Icon className="w-16 h-16 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-4 tracking-tight">{slide.title}</h2>
        <p className="text-center text-gray-500 max-w-sm mb-12 text-lg">{slide.description}</p>
        
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <div key={index} className={`h-2 rounded-full transition-all ${index === currentSlide ? "w-8 bg-emerald-600" : "w-2 bg-gray-200"}`} />
          ))}
        </div>
      </div>

      <div className="p-8">
        <Button onClick={handleNext} fullWidth size="lg">
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
