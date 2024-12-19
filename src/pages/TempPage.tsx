import React from 'react';
import { Construction } from 'lucide-react';

export function TempPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Construction className="h-16 w-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
        Under Construction
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        This page is currently being developed. Check back soon!
      </p>
    </div>
  );
}