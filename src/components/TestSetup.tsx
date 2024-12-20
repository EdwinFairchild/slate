import React, { useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Clock, Play, Trash2 } from 'lucide-react';
import { Switch } from './ui/Switch';
import { CommandForm } from './CommandForm';
import type { Command } from '../types/test';
import { useDevice } from '../components/DeviceContext';

interface Test {
  id: string;
  name: string;
  duration: number;
  interval: number;
  chainCommands: boolean;
  commands: Command[];
  isExpanded: boolean;
}

interface TestSetupProps {
  onStartTest: (test: Omit<Test, 'id' | 'isExpanded'>) => void;
}

export function TestSetup({ onStartTest }: TestSetupProps) {
  const { addLog } = useDevice();

  // State for the list of tests
  const [tests, setTests] = useState<Test[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      duration: 60,
      interval: 1000,
      chainCommands: false,
      commands: [{ command: '', runOnce: false, waitAfter: 0 }],
      isExpanded: true,
    },
  ]);

  // Add a new test template
  const handleAddTest = () => {
    setTests((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        duration: 60,
        interval: 1000,
        chainCommands: false,
        commands: [{ command: '', runOnce: false, waitAfter: 0 }],
        isExpanded: true,
      },
    ]);
  };

  // Remove a specific test
  const handleRemoveTest = (id: string) => {
    setTests((prev) => prev.filter((test) => test.id !== id));
  };

  // Toggle expand/collapse for a test
  const toggleExpand = (id: string) => {
    setTests((prev) =>
      prev.map((test) =>
        test.id === id ? { ...test, isExpanded: !test.isExpanded } : test
      )
    );
  };

  // Update test details (e.g., name, duration)
  const handleTestChange = (id: string, changes: Partial<Test>) => {
    setTests((prev) =>
      prev.map((test) => (test.id === id ? { ...test, ...changes } : test))
    );
  };

  // Handle form submission for a test
  const handleSubmit = (test: Test) => async (e: React.FormEvent) => {
    e.preventDefault();
    e.preventDefault();
    
    const { id, isExpanded, ...testData } = test; // Exclude local properties
    try {
      await onStartTest(testData); // Call the parent handler to start the test
      addLog('info', `Test "${testData.name}" started.`);
    } catch (error) {
      addLog('error', `Failed to start test: ${error.message || error}`);
    }
  };

  return (
    <div className="space-y-3">
      {/* Render all tests */}
      {tests.map((test) => (
        <div key={test.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => toggleExpand(test.id)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {test.isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {test.name || 'New Test'}
              </h2>
            </div>
            <button
              onClick={() => handleRemoveTest(test.id)}
              className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Expandable test form */}
          {test.isExpanded && (
            <form onSubmit={handleSubmit(test)} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test Name
                </label>
                <input
                  type="text"
                  value={test.name}
                  onChange={(e) => handleTestChange(test.id, { name: e.target.value })}
                  className="block w-full h-9 px-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  placeholder="Enter test name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test Interval (ms)
                </label>
                <input
                  type="number"
                  value={test.interval}
                  onChange={(e) =>
                    handleTestChange(test.id, { interval: Number(e.target.value) })
                  }
                  className="block w-full h-9 px-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test Duration (minutes)
                </label>
                <input
                  type="number"
                  value={test.duration}
                  onChange={(e) =>
                    handleTestChange(test.id, { duration: Number(e.target.value) })
                  }
                  className="block w-full h-9 px-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chain Commands
                </span>
                <Switch
                  checked={test.chainCommands}
                  onChange={(checked) => {
                    handleTestChange(test.id, { chainCommands: checked });
                  }}
                  label="Enable command chaining"
                  type="button" // Prevent form submission
                  onClick={(e) => e.preventDefault()} // Prevent accidental form submission
                />
              </div>

              <CommandForm
                commands={test.commands}
                chainCommands={test.chainCommands}
                onCommandsChange={(commands) => handleTestChange(test.id, { commands })}
                onSubmit={(e: React.FormEvent) => e.preventDefault()} // Prevent accidental form submission
              />


              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Test
              </button>
            </form>
          )}
        </div>
      ))}

      {/* Button to add a new test */}
      <button
        onClick={handleAddTest}
        className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Test
      </button>
    </div>
  );

}
