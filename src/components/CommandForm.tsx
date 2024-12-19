import React from 'react';
import { Plus, Minus } from 'lucide-react';
import type { Command } from '../types/test';

interface CommandFormProps {
  commands: Command[];
  chainCommands: boolean;
  onCommandsChange: (commands: Command[]) => void;
}

export function CommandForm({ commands, chainCommands, onCommandsChange }: CommandFormProps) {
  const handleAddCommand = () => {
    onCommandsChange([...commands, { command: '', interval: 1000, waitAfter: 0 }]);
  };

  const handleRemoveCommand = (index: number) => {
    onCommandsChange(commands.filter((_, i) => i !== index));
  };

  const handleCommandChange = (index: number, field: keyof Command, value: string | number) => {
    const newCommands = [...commands];
    newCommands[index] = { ...newCommands[index], [field]: value };
    onCommandsChange(newCommands);
  };

  return (
    <div className="space-y-3">
      {commands.map((command, index) => (
        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Command {index + 1}
            </h3>
            {chainCommands && commands.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveCommand(index)}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <Minus className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SCPI Command
              </label>
              <input
                type="text"
                value={command.command}
                onChange={(e) => handleCommandChange(index, 'command', e.target.value)}
                className="block w-full h-9 px-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                placeholder="e.g., *IDN?"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interval (ms)
              </label>
              <input
                type="number"
                value={command.interval}
                onChange={(e) => handleCommandChange(index, 'interval', Number(e.target.value))}
                className="block w-full h-9 px-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                min="100"
                required
              />
            </div>
          </div>

          {chainCommands && index < commands.length - 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wait After Command (ms)
              </label>
              <input
                type="number"
                value={command.waitAfter}
                onChange={(e) => handleCommandChange(index, 'waitAfter', Number(e.target.value))}
                className="block w-full h-9 px-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                min="0"
              />
            </div>
          )}
        </div>
      ))}

      {chainCommands && (
        <button
          type="button"
          onClick={handleAddCommand}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-900/50 dark:hover:bg-blue-900"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Command
        </button>
      )}
    </div>
  );
}