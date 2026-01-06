'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SidebarState {
  isOpen: boolean;
  width: number;
  position: 'left' | 'right';
}

interface SidebarContextValue {
  sidebar: SidebarState;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setWidth: (width: number) => void;
  setPosition: (position: 'left' | 'right') => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebar, setSidebar] = useState<SidebarState>({
    isOpen: true,
    width: DEFAULT_WIDTH,
    position: 'left',
  });

  const toggle = useCallback(() => {
    setSidebar(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const open = useCallback(() => {
    setSidebar(prev => ({ ...prev, isOpen: true }));
  }, []);

  const close = useCallback(() => {
    setSidebar(prev => ({ ...prev, isOpen: false }));
  }, []);

  const setWidth = useCallback((width: number) => {
    setSidebar(prev => ({
      ...prev,
      width: Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH),
    }));
  }, []);

  const setPosition = useCallback((position: 'left' | 'right') => {
    setSidebar(prev => ({ ...prev, position }));
  }, []);

  return (
    <SidebarContext.Provider value={{ sidebar, toggle, open, close, setWidth, setPosition }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH };
