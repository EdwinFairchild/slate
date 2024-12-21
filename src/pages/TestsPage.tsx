import React from 'react';
import { TestSetup } from '../components/TestSetup';
// import { TestResultsTable } from '../components/TestResultsTable';
import { SCPIReference } from '../components/SCPIReference';
import type { TestResult } from '../types/test';

interface TestsPageProps {
  tests: TestResult[];
  onStartTest: (test: any) => void;
}

export function TestsPage({ tests, onStartTest }: TestsPageProps) {
  return (
    <div className="space-y-6 h-full overflow-auto pb-4">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <TestSetup onStartTest={onStartTest} />
        </div>
        <div className="col-span-5">
          <SCPIReference />
        </div>
      </div>
      
      {/* <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Test Results
        </h2>
        <TestResultsTable tests={tests} />
      </div> */}
    </div>
  );
}