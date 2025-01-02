import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme as useLocalTheme } from '../hooks/useTheme';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}



const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme, setTheme } = useLocalTheme();

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
