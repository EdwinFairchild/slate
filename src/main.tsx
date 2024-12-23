import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DeviceProvider } from './components/DeviceContext';
import { AnalyzePageProvider } from './components/AnalyzePageContext';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <DeviceProvider>
      <AnalyzePageProvider>
      <App />
      </AnalyzePageProvider>
    </DeviceProvider>
  </StrictMode>
);
