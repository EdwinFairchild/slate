import React, { useState } from 'react';
import { Search, Copy, Check } from 'lucide-react';
import { useDevice } from '../components/DeviceContext';
interface SCPICommand {
  category: string;
  command: string;
  description: string;
}

const scpiCommands: SCPICommand[] = [
  {
    category: 'System',
    command: '*IDN?',
    description: 'Query the device identification'
  },
  {
    category: 'System',
    command: '*RST',
    description: 'Reset the device to default settings'
  },
  {
    category: 'Measurement',
    command: 'CYMOMETER?',
    description: 'Read Freq. Counter'
  },
  {
    category: 'Measurement',
    command: 'C1:BSWV?',
    description: 'Reads basic wave parameters'
  },
  {
    category: 'Measurement',
    command: 'MEAS:CURR?',
    description: 'Measure current'
  },
  {
    category: 'Measurement',
    command: 'MEAS:RES?',
    description: 'Measure resistance'
  },
  {
    category: 'Configuration',
    command: 'CONF:VOLT:DC',
    description: 'Configure for DC voltage measurements'
  },
  {
    category: 'Configuration',
    command: 'CONF:CURR:DC',
    description: 'Configure for DC current measurements'
  }
];

export function SCPIReference() {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const { selectedDevice, addLog } = useDevice();
  const [customCommand, setCustomCommand] = useState('');
  const filteredCommands = scpiCommands.filter(cmd =>
    cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const testCommand = async (command: string) => {
    if (!selectedDevice?.isConnected) {
      
      addLog('error', "No connected device selected.");
      return;
    }
    try {
      const response = await window.api.testCommand(command);

      addLog('info', `Response: ${response} command: ${command}`);
    } catch (error) {

      addLog('error', `Error: ${error} command: ${command}`);
    }
  };
  const handleSendCustomCommand = () => {
    if (customCommand.trim() === '') {
      addLog('info', 'Please enter a command.');
      return;
    }
    testCommand(customCommand); // Call testCommand with the custom command
    //setCustomCommand(''); // Clear the input field after sending
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        SCPI Reference
      </h2>
      {/* Custom Command Input and Button */}
      <div className="flex items-center mb-4 space-x-2">
        <input
          type="text"
          value={customCommand}
          onChange={(e) => setCustomCommand(e.target.value)}
          placeholder="Enter SCPI command..."
          className="flex-1 pl-3 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          onClick={handleSendCustomCommand}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
      <div className="relative mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search commands..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4 overflow-hidden">
        {Object.entries(
          filteredCommands.reduce((acc, cmd) => {
            if (!acc[cmd.category]) acc[cmd.category] = [];
            acc[cmd.category].push(cmd);
            return acc;
          }, {} as Record<string, SCPICommand[]>)
        ).map(([category, commands]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {category}
            </h3>
            <div className="space-y-2">
              {commands.map((cmd) => (
                <div
                  key={cmd.command}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {cmd.command}
                    </code>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => handleCopy(cmd.command)}
                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        title="Copy command"
                      >
                        {copiedCommand === cmd.command ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => testCommand(cmd.command)}
                        className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        title="Test command"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Test
                        </span>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {cmd.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}