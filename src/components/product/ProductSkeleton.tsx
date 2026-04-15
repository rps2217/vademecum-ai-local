import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-brand-surface rounded-2xl p-5 border border-slate-800 animate-pulse flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-800 rounded-md w-3/4"></div>
          <div className="h-3 bg-slate-800 rounded-md w-1/2"></div>
        </div>
        <div className="h-4 bg-slate-800 rounded-md w-16"></div>
      </div>

      <div className="space-y-3 mb-6 flex-1">
        <div className="space-y-1">
          <div className="h-2 bg-slate-800 rounded-md w-20"></div>
          <div className="h-3 bg-slate-800 rounded-md w-full"></div>
          <div className="h-3 bg-slate-800 rounded-md w-5/6"></div>
        </div>
        <div className="space-y-1">
          <div className="h-2 bg-slate-800 rounded-md w-20"></div>
          <div className="h-3 bg-slate-800 rounded-md w-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800">
        <div className="h-6 bg-slate-800 rounded-md"></div>
        <div className="h-6 bg-slate-800 rounded-md"></div>
        <div className="h-6 bg-slate-800 rounded-md"></div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex gap-3">
        <div className="h-10 bg-slate-800 rounded-xl flex-1"></div>
        <div className="h-10 bg-slate-800 rounded-lg w-24"></div>
      </div>
    </div>
  );
};
