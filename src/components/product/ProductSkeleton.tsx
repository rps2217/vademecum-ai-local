import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-xl p-4 border border-border animate-pulse flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 space-y-2 pr-4">
          <div className="h-5 bg-card rounded-md w-full"></div>
          <div className="h-3 bg-card rounded-md w-2/3"></div>
        </div>
        <div className="h-4 bg-card rounded-md w-12"></div>
      </div>

      <div className="space-y-4 mb-4 flex-1">
        <div className="space-y-2">
          <div className="h-2 bg-card rounded-md w-1/3"></div>
          <div className="h-3 bg-card rounded-md w-full"></div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-6 bg-card rounded-lg"></div>
          <div className="h-6 bg-card rounded-lg"></div>
          <div className="h-6 bg-card rounded-lg"></div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border flex items-center gap-2">
        <div className="h-9 bg-card rounded-lg flex-1"></div>
        <div className="h-9 w-9 bg-card rounded-lg"></div>
        <div className="h-9 w-9 bg-card rounded-lg"></div>
      </div>
    </div>
  );
};
