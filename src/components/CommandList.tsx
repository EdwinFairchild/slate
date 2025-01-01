import React from 'react';
import { Play, Square, Trash2 } from 'lucide-react';
import type { SCPICommand } from '../types';

interface CommandListProps {
  commands: SCPICommand[];
  onToggleCommand: (id: string) => void;
  onDeleteCommand: (id: string) => void;
}

export function CommandList({ commands, onToggleCommand, onDeleteCommand }: CommandListProps) {
  return (
    <div className="space-y-4">
      {commands.map((cmd) => (
        <div
          key={cmd.id}
          className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-md shadow"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cmd.command}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Interval: {cmd.interval}ms
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onToggleCommand(cmd.id)}
              className={`p-2 rounded-full ${cmd.isRunning
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                  : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                }`}
            >
              {cmd.isRunning ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={() => onDeleteCommand(cmd.id)}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}