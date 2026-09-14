'use client';

import React, { createContext, useContext } from 'react';
import { Kit } from '../../../types/kit';

export interface KitContextType {
  kit: Kit | null;
  setKit: React.Dispatch<React.SetStateAction<Kit | null>>;
  loading: boolean;
  refreshKit: () => Promise<void>;
}

export const KitContext = createContext<KitContextType | null>(null);

export function useKitContext(): KitContextType {
  const context = useContext(KitContext);
  if (!context) {
    throw new Error('useKitContext must be used within a KitLayout (KitProvider)');
  }
  return context;
}
