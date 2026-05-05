import React from "react";

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-neutral-800 ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton({ className = "" }) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-3xl border-2 border-gray-100 dark:border-neutral-800 p-6 shadow-xl ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="flex justify-between gap-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function StationCardSkeleton({ className = "" }) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4 shadow-sm ${className}`}>
      <div className="flex gap-4">
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="bg-gradient-to-br from-emerald-600/80 via-green-600/80 to-teal-700/80 pt-14 pb-10 px-4 lg:px-8 relative overflow-hidden animate-pulse">
      <div className="max-w-6xl mx-auto relative z-10">
        <Skeleton className="h-10 w-64 bg-white/20 mb-3" />
        <Skeleton className="h-6 w-96 bg-white/20" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border-2 border-gray-100 dark:border-neutral-800 p-6 shadow-xl">
      <Skeleton className="h-6 w-48 mb-6" />
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      <div className="relative h-64 lg:h-80 w-full flex items-end gap-2 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-sm" 
            style={{ height: `${20 + Math.random() * 60}%` }} 
          />
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="w-5 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContributionItemSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4 flex gap-4">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-4 pt-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
