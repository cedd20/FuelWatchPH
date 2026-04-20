import { useEffect, useState } from 'react'
import { Fuel } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      // Small delay for the fade animation before calling onComplete
      setTimeout(onComplete, 500)
    }, 2800)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-gray-950 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] shadow-2xl shadow-blue-500/40 animate-pulse transition-transform duration-1000 scale-110">
            <Fuel className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -inset-8 bg-blue-500/20 rounded-full blur-3xl animate-pulse -z-10"></div>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-white dark:to-blue-200">
            FuelWatchPH
          </h1>
          <p className="text-slate-400 font-bold tracking-[0.4em] uppercase text-[10px]">
             Community Powered
          </p>
        </div>

        <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-8">
          <div className="h-full bg-blue-600 rounded-full w-0 animate-[loading_2s_ease-in-out_forwards]"></div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  )
}
