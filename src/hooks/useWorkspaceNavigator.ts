'use client';

import { useReducer, useCallback, useEffect, useRef } from 'react';

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

export type NavigatorView = 'browse' | 'confirm' | 'deploying' | 'deployed';

export interface DeployStage {
  id: string;
  label: string;
  duration: number;
}

export const DEPLOY_STAGES: DeployStage[] = [
  { id: 'connect', label: 'Connecting to bridge...', duration: 800 },
  { id: 'validate', label: 'Validating workspace...', duration: 600 },
  { id: 'sync', label: 'Syncing files...', duration: 1200 },
  { id: 'provision', label: 'Provisioning environment...', duration: 1000 },
  { id: 'ready', label: 'Ready', duration: 400 },
];

export interface DeployLog {
  time: string;
  level: 'info' | 'success' | 'error';
  message: string;
}

export interface NavigatorWorkspace {
  id: string;
  name: string;
  description: string;
  path: string;
  vpsPath: string;
  type: 'local' | 'remote';
  status: 'active' | 'idle';
  lastActivity: string;
  activeAgents: number;
  openWork: number;
  synced: boolean;
  hasActivity: boolean;
}

export type InfraStatus = 'online' | 'offline' | 'syncing' | 'error';

export interface InfraItem {
  status: InfraStatus;
  label: string;
  detail: string;
  ip?: string;
  lastSync?: string;
}

export interface Infrastructure {
  vps: InfraItem;
  local: InfraItem;
  sync: InfraItem;
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

interface NavigatorState {
  view: NavigatorView;
  selectedWorkspace: NavigatorWorkspace | null;
  deployStage: number;
  logs: DeployLog[];
  isDeploying: boolean;
}

type NavigatorAction =
  | { type: 'SET_VIEW'; payload: NavigatorView }
  | { type: 'SELECT_WORKSPACE'; payload: NavigatorWorkspace }
  | { type: 'START_DEPLOY' }
  | { type: 'SET_DEPLOY_STAGE'; payload: number }
  | { type: 'ADD_LOG'; payload: DeployLog }
  | { type: 'RESET_LOGS' }
  | { type: 'DEPLOY_COMPLETE' }
  | { type: 'GO_BACK' };

const initialState: NavigatorState = {
  view: 'browse',
  selectedWorkspace: null,
  deployStage: 0,
  logs: [],
  isDeploying: false,
};

function navigatorReducer(state: NavigatorState, action: NavigatorAction): NavigatorState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };

    case 'SELECT_WORKSPACE':
      return {
        ...state,
        selectedWorkspace: action.payload,
        view: 'confirm',
      };

    case 'START_DEPLOY':
      return {
        ...state,
        view: 'deploying',
        isDeploying: true,
        deployStage: 0,
        logs: [],
      };

    case 'SET_DEPLOY_STAGE':
      return { ...state, deployStage: action.payload };

    case 'ADD_LOG':
      return { ...state, logs: [...state.logs, action.payload] };

    case 'RESET_LOGS':
      return { ...state, logs: [] };

    case 'DEPLOY_COMPLETE':
      return {
        ...state,
        view: 'deployed',
        isDeploying: false,
        deployStage: DEPLOY_STAGES.length,
      };

    case 'GO_BACK':
      if (state.view === 'confirm') {
        return { ...state, view: 'browse', selectedWorkspace: null };
      }
      if (state.view === 'deployed') {
        return { ...state, view: 'browse', selectedWorkspace: null };
      }
      return state;

    default:
      return state;
  }
}

// =============================================================================
// MOCK DATA (for development)
// =============================================================================

export const MOCK_WORKSPACES: NavigatorWorkspace[] = [
  {
    id: 'mentu-ai',
    name: 'mentu-ai',
    description: 'Core ledger, CLI, 43 commands',
    path: '/Users/rashid/Desktop/Workspaces/mentu-ai',
    vpsPath: '/home/mentu/Workspaces/mentu-ai',
    type: 'local',
    status: 'active',
    lastActivity: '2 min ago',
    activeAgents: 1,
    openWork: 3,
    synced: true,
    hasActivity: true,
  },
  {
    id: 'mentu-web',
    name: 'mentu-web',
    description: 'Next.js dashboard',
    path: '/Users/rashid/Desktop/Workspaces/mentu-web',
    vpsPath: '/home/mentu/Workspaces/mentu-web',
    type: 'local',
    status: 'idle',
    lastActivity: '1 hour ago',
    activeAgents: 0,
    openWork: 5,
    synced: true,
    hasActivity: false,
  },
  {
    id: 'mentu-bridge',
    name: 'mentu-bridge',
    description: 'Mac daemon for 24/7 execution',
    path: '/Users/rashid/Desktop/Workspaces/mentu-bridge',
    vpsPath: '/home/mentu/Workspaces/mentu-bridge',
    type: 'local',
    status: 'active',
    lastActivity: '5 min ago',
    activeAgents: 2,
    openWork: 1,
    synced: true,
    hasActivity: true,
  },
  {
    id: 'mentu-proxy',
    name: 'mentu-proxy',
    description: 'Cloudflare Worker gateway',
    path: '/Users/rashid/Desktop/Workspaces/mentu-proxy',
    vpsPath: '/home/mentu/Workspaces/mentu-proxy',
    type: 'local',
    status: 'idle',
    lastActivity: '3 days ago',
    activeAgents: 0,
    openWork: 0,
    synced: false,
    hasActivity: false,
  },
  {
    id: 'claude-code',
    name: 'claude-code',
    description: 'Canonical registry + tools',
    path: '/Users/rashid/Desktop/Workspaces/claude-code',
    vpsPath: '/home/mentu/Workspaces/claude-code',
    type: 'local',
    status: 'idle',
    lastActivity: '1 day ago',
    activeAgents: 0,
    openWork: 2,
    synced: true,
    hasActivity: false,
  },
];

export const MOCK_INFRASTRUCTURE: Infrastructure = {
  vps: {
    status: 'online',
    label: 'VPS',
    detail: 'mentu-vps-01',
    ip: '208.167.255.71',
  },
  local: {
    status: 'online',
    label: 'Local',
    detail: 'MacBook Pro',
  },
  sync: {
    status: 'online',
    label: 'Sync',
    detail: 'SyncThing',
    lastSync: '30s ago',
  },
};

export const MOCK_DEPLOY_LOGS: DeployLog[] = [
  { time: '00:00.000', level: 'info', message: 'Initiating workspace deployment...' },
  { time: '00:00.124', level: 'info', message: 'Connecting to mentu-bridge daemon...' },
  { time: '00:00.842', level: 'success', message: 'Bridge connection established' },
  { time: '00:01.056', level: 'info', message: 'Validating workspace manifest...' },
  { time: '00:01.234', level: 'info', message: 'Found .mentu/manifest.yaml (v1.1.0)' },
  { time: '00:01.567', level: 'success', message: 'Workspace validated' },
  { time: '00:01.890', level: 'info', message: 'Checking SyncThing status...' },
  { time: '00:02.345', level: 'info', message: 'Sync status: 100% complete' },
  { time: '00:02.678', level: 'success', message: 'Files synchronized' },
  { time: '00:03.012', level: 'info', message: 'Provisioning Claude Code environment...' },
  { time: '00:03.456', level: 'info', message: 'Loading workspace context...' },
  { time: '00:03.890', level: 'info', message: 'Reading CLAUDE.md...' },
  { time: '00:04.234', level: 'success', message: 'Environment ready' },
  { time: '00:04.567', level: 'success', message: 'Deployment complete!' },
];

// =============================================================================
// HOOK
// =============================================================================

export function useWorkspaceNavigator() {
  const [state, dispatch] = useReducer(navigatorReducer, initialState);
  const logIndexRef = useRef(0);
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
      if (logTimerRef.current) clearTimeout(logTimerRef.current);
    };
  }, []);

  // Deployment simulation effect
  useEffect(() => {
    if (state.view !== 'deploying') {
      logIndexRef.current = 0;
      return;
    }

    let currentStage = 0;

    const addLog = () => {
      if (logIndexRef.current < MOCK_DEPLOY_LOGS.length) {
        dispatch({ type: 'ADD_LOG', payload: MOCK_DEPLOY_LOGS[logIndexRef.current] });
        logIndexRef.current++;
      }
    };

    const progressStage = () => {
      if (currentStage < DEPLOY_STAGES.length) {
        dispatch({ type: 'SET_DEPLOY_STAGE', payload: currentStage });

        // Add 2-3 logs per stage
        addLog();
        setTimeout(addLog, 200);
        setTimeout(addLog, 400);

        currentStage++;
        stageTimerRef.current = setTimeout(progressStage, DEPLOY_STAGES[currentStage - 1]?.duration || 800);
      } else {
        // All stages complete, add remaining logs then transition
        const finishLogs = () => {
          if (logIndexRef.current < MOCK_DEPLOY_LOGS.length) {
            addLog();
            logTimerRef.current = setTimeout(finishLogs, 100);
          } else {
            // Transition to deployed state after small delay
            setTimeout(() => {
              dispatch({ type: 'DEPLOY_COMPLETE' });
            }, 500);
          }
        };
        finishLogs();
      }
    };

    progressStage();

    return () => {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
      if (logTimerRef.current) clearTimeout(logTimerRef.current);
    };
  }, [state.view]);

  // Actions
  const selectWorkspace = useCallback((workspace: NavigatorWorkspace) => {
    dispatch({ type: 'SELECT_WORKSPACE', payload: workspace });
  }, []);

  const confirmDeploy = useCallback(() => {
    dispatch({ type: 'START_DEPLOY' });
  }, []);

  const cancel = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  const back = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  return {
    // State
    view: state.view,
    selectedWorkspace: state.selectedWorkspace,
    deployStage: state.deployStage,
    logs: state.logs,
    isDeploying: state.isDeploying,

    // Actions
    selectWorkspace,
    confirmDeploy,
    cancel,
    back,
  };
}
