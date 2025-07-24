// src/components/SkeletonCard.jsx
import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200"></div>
      
      <div className="p-4 space-y-3">
        {/* Title Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        
        {/* Subtitle Skeleton */}
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        
        {/* Bottom line Skeleton */}
        <div className="flex justify-between items-center pt-2">
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;