'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TerminalContextValue {
  isOpen: boolean;
  height: number;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setHeight: (height: number) => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

const MIN_HEIGHT = 150;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 300;

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeightState] = useState(DEFAULT_HEIGHT);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const setHeight = useCallback((newHeight: number) => {
    setHeightState(Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT));
  }, []);

  return (
    <TerminalContext.Provider value={{ isOpen, height, toggle, open, close, setHeight }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}
