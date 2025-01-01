import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Button, Typography, TextField, Modal } from '@mui/material';
import { ChevronDown, ChevronUp, Trash2, Plus, Play } from 'lucide-react';
import { Switch } from './ui/Switch';
import { CommandForm } from './CommandForm';
import { SCPIReference } from './SCPIReference';
// import { useTheme } from '@mui/material/styles'
import { useThemeContext } from './ThemeProvider';
interface Command {
  command: string;
  runOnce: boolean;
  waitAfter: number;
}

interface Test {
  id: string;
  name: string;
  duration: number;
  interval: number;
  chainCommands: boolean;
  commands: Command[];
  isExpanded: boolean;
  firstCol: 'Timestamp' | 'Index' | 'Both';
}

interface TestSetupProps {
  onStartTest: (test: Omit<Test, 'id' | 'isExpanded'>) => void;
}

export function TestSetup({ onStartTest }: TestSetupProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [expandedTest, setExpandedTest] = useState<Test | null>(null);
  const hasLoadedRef = useRef(false);
  const oldTestsRef = useRef<Test[]>([]);
  const { theme } = useThemeContext(); // Access the current theme
  // Load tests from API
  useEffect(() => {
    (async () => {
      try {
        const loadedTests: Test[] = await window.api.getTests();
        setTests(loadedTests);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Error loading tests from file:', err);
      }
    })();
  }, []);

  // Save tests to API whenever they change
  useEffect(() => {
    if (JSON.stringify(tests) !== JSON.stringify(oldTestsRef.current)) {
      window.api.saveTests(tests);
      oldTestsRef.current = tests;
    }
  }, [tests]);

  const handleAddTest = () => {
    const newTest: Test = {
      id: crypto.randomUUID(),
      name: '',
      duration: 1,
      interval: 1000,
      chainCommands: false,
      commands: [{ command: '', runOnce: false, waitAfter: 0 }],
      isExpanded: false,
      firstCol: 'Index',
    };
    setTests((prev) => [...prev, newTest]);
  };

  const handleRemoveTest = (id: string) => {
    setTests((prev) => prev.filter((test) => test.id !== id));
  };

  const toggleExpand = (id: string) => {
    const selectedTest = tests.find((test) => test.id === id);
    setExpandedTest((prev) => (prev?.id === id ? null : selectedTest || null));
  };

  const handleTestChange = (id: string, changes: Partial<Test>) => {
    setTests((prev) =>
      prev.map((test) => (test.id === id ? { ...test, ...changes } : test))
    );

    if (expandedTest?.id === id) {
      setExpandedTest((prev) => (prev ? { ...prev, ...changes } : null));
    }
  };

  const handleSubmit = (test: Test) => async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, isExpanded, ...testData } = test;
    await onStartTest(testData);
    setExpandedTest(null);
  };

  return (
    <div>
      {/* Grid layout for tests */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {tests.map((test) => (
          <div
            key={test.id}
            className="p-4 rounded-lg transition-transform duration-300 backdrop-blur-lg shadow-lg
            bg-white/100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700
            hover:translate-y-[-8px] hover:shadow-xl"
          >
            <div className="flex justify-between items-center mb-2" onClick={() => toggleExpand(test.id)}>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {test.name || 'New Test'}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent click from propagating to the parent
                    handleRemoveTest(test.id);
                  }}
                  className="p-2 rounded-full bg-red-100 dark:bg-gray-700 hover:bg-red-200 dark:hover:bg-gray-600
                    text-red-600 dark:text-gray-300 hover:text-red-800 dark:hover:text-gray-100"
                >
                  <Trash2 />
                </button>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for expanded test */}
      <Modal
  open={!!expandedTest}
  onClose={() => setExpandedTest(null)}
  aria-labelledby="expanded-test-modal"
  aria-describedby="expanded-test-content"
>
  <div
    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-5xl bg-white/40 dark:bg-gray-800/30 text-gray-900 dark:text-gray-100 shadow-lg rounded-lg p-6 max-h-[80vh] overflow-y-auto backdrop-blur-lg border border-gray-200 dark:border-gray-700"
  >
    {expandedTest && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Form */}
        <form onSubmit={handleSubmit(expandedTest)} className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">{expandedTest.name || 'New Test'}</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Name
            </label>
            <input
              type="text"
              value={expandedTest.name}
              onChange={(e) =>
                handleTestChange(expandedTest.id, { name: e.target.value })
              }
              className="focus:outline-none w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Interval (ms)
            </label>
            <input
              type="number"
              value={expandedTest.interval}
              onChange={(e) =>
                handleTestChange(expandedTest.id, { interval: Number(e.target.value) })
              }
              className=" focus:outline-none w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Duration (minutes)
            </label>
            <input
              type="number"
              value={expandedTest.duration}
              onChange={(e) =>
                handleTestChange(expandedTest.id, { duration: Number(e.target.value) })
              }
              className="focus:outline-none w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Iteration Label
            </h3>
            <div className="flex space-x-2">
              {['Timestamp', 'Index', 'Both'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    handleTestChange(expandedTest.id, { firstCol: label as Test['firstCol'] })
                  }
                  className={`px-3 py-1.5 rounded-md ${
                    expandedTest.firstCol === label
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Chain Commands
            </span>
            <Switch
              checked={expandedTest.chainCommands}
              onChange={(checked) =>
                handleTestChange(expandedTest.id, { chainCommands: checked })
              }
            />
          </div>

          <CommandForm
            commands={expandedTest.commands}
            chainCommands={expandedTest.chainCommands}
            onCommandsChange={(commands) =>
              handleTestChange(expandedTest.id, { commands })
            }
          />

          <button
            type="submit"
            className="w-full py-2 mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md"
          >
            Start Test
          </button>
        </form>

        {/* Right Column: SCPI Reference */}
        <div>
          <SCPIReference />
        </div>
      </div>
    )}
  </div>
</Modal>


      {/* Add New Test Button */}
      <div className="flex justify-center mt-3">
        <button
          onClick={handleAddTest}
          className="px-4 py-2 border border-dashed border-blue-500 rounded-md text-blue-500 hover:border-blue-700 hover:text-blue-700"
        >
          Add New Test
        </button>
      </div>
    </div>
  );

}
