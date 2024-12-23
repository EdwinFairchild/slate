import React from 'react';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';

interface AlertProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success'; // Alert types for styling
}

export const Alert: React.FC<AlertProps> = ({ message, type = 'info' }) => {
  const typeClasses = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  };

  const Icon = {
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
    error: ExclamationTriangleIcon,
    success: CheckCircleIcon,
  }[type];

  return (
    <div
      className={`flex items-center rounded-md p-3 my-2 shadow-sm border ${typeClasses[type]}`}
    >
      {Icon && <Icon className="h-6 w-6 mr-3" />}
      <span>{message}</span>
    </div>
  );
};
