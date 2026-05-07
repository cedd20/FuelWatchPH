import { useEffect, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  headerRight,
  initialHeightVh = 38,
  expandedHeightVh = 68,
  zIndexClassName = "z-40",
}) {
  const [sheetHeight, setSheetHeight] = useState(initialHeightVh);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setSheetHeight(initialHeightVh);
    setIsDragging(false);
    dragStateRef.current = null;
  }, [initialHeightVh, isOpen]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event) => {
      if (!dragStateRef.current) return;

      const deltaY = dragStateRef.current.startY - event.clientY;
      const deltaVh = (deltaY / window.innerHeight) * 100;
      const nextHeight = clamp(
        dragStateRef.current.startHeight + deltaVh,
        initialHeightVh,
        expandedHeightVh,
      );

      setSheetHeight(nextHeight);
    };

    const handlePointerUp = () => {
      if (!dragStateRef.current) return;

      const midpoint = (initialHeightVh + expandedHeightVh) / 2;
      setSheetHeight((currentHeight) => (currentHeight >= midpoint ? expandedHeightVh : initialHeightVh));
      setIsDragging(false);
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [expandedHeightVh, initialHeightVh, isDragging]);

  if (!isOpen) return null;

  return (
    <div className={`lg:hidden fixed inset-0 ${zIndexClassName} flex items-end`}>
      <div className="absolute inset-0 bg-black/18" onClick={onClose} />
      <div
        className="relative mt-auto w-full rounded-t-[1.9rem] bg-white/98 dark:bg-neutral-900/98 border-t border-white/40 dark:border-neutral-700/70 shadow-[0_-22px_48px_rgba(15,23,42,0.24)] flex flex-col transition-[height] duration-300 ease-out"
        style={{ height: `min(${sheetHeight}vh, 100vh)` }}
      >
        <div
          onPointerDown={(event) => {
            dragStateRef.current = {
              startY: event.clientY,
              startHeight: sheetHeight,
            };
            setIsDragging(true);
          }}
          className="shrink-0 px-5 pt-3 pb-3 touch-none"
        >
          <div className="w-14 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mb-4" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {badge ? (
                <div className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                  {badge}
                </div>
              ) : null}
              <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
              {subtitle ? (
                <p className="mt-1 text-sm font-medium text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {headerRight}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 px-5 py-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] border-t border-gray-200 dark:border-neutral-700 bg-white/96 dark:bg-neutral-900/96">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
