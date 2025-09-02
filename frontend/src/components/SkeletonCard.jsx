// src/components/SkeletonCard.jsx
import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-card dark:bg-dark-subtle rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-muted dark:bg-inkwell"></div>
      
      <div className="p-4 space-y-3">
        {/* Title Skeleton */}
        <div className="h-4 bg-muted dark:bg-inkwell rounded w-3/4"></div>
        
        {/* Subtitle Skeleton */}
        <div className="h-3 bg-muted dark:bg-inkwell rounded w-1/2"></div>
        
        {/* Bottom line Skeleton */}
        <div className="flex justify-between items-center pt-2">
          <div className="h-3 bg-muted dark:bg-inkwell rounded w-1/4"></div>
          <div className="h-3 bg-muted dark:bg-inkwell rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;