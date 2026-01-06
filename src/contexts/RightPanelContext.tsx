'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface RightPanelContextType {
  isOpen: boolean;
  width: number;
  setOpen: (open: boolean) => void;
}

const RightPanelContext = createContext<RightPanelContextType | null>(null);

const DEFAULT_WIDTH = 400; // matches CommitmentPanel width

export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <RightPanelContext.Provider
      value={{
        isOpen,
        width: DEFAULT_WIDTH,
        setOpen: setIsOpen,
      }}
    >
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel() {
  const context = useContext(RightPanelContext);
  if (!context) {
    throw new Error('useRightPanel must be used within RightPanelProvider');
  }
  return context;
}
