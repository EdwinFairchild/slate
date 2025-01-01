import React from 'react';
import { TestSetup } from '../components/TestSetup';
import { DeviceStatus } from '../components/DeviceStatus';
import type { TestResult } from '../types/test';

interface TestsPageProps {
  tests: TestResult[];
  onStartTest: (test: any) => void;
}

export function TestsPage({ tests, onStartTest }: TestsPageProps) {
  return (
    <div className="h-full overflow-auto pb-4">
      {/* Device Status at the top */}
      <DeviceStatus />

      {/* Grid layout for tests */}
      <div className="grid grid-cols-12 gap-6 mt-4 ">
        <div className="col-span-12">
          <TestSetup onStartTest={onStartTest} />
        </div>
      </div>
    </div>
  );
}
