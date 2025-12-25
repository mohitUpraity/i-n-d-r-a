import React from 'react';

// Simple Tailwind-based Loader to avoid adding a styled-components dependency
export default function Loader({ size = 'md', label = 'Loading...' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';

  return (
    <div className="flex items-center justify-center p-6">
      <div className="flex flex-col items-center">
        <svg className={`${sizeClass} animate-spin text-green-600`} viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        {label && <div className="text-sm text-gray-600 mt-2">{label}</div>}
      </div>
    </div>
  );
}
