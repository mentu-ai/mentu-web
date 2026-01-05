/**
 * =============================================================================
 * MENTU WORKSPACE NAVIGATOR - MOBILE REFERENCE PROTOTYPE
 * =============================================================================
 *
 * A complete reference implementation of the 4-state deploy flow for the
 * Workspace Navigator component. This prototype demonstrates:
 *
 * 1. BROWSE    - Grid of workspace cards with real-time status
 * 2. CONFIRM   - Slide-up modal with deployment preview
 * 3. DEPLOYING - Animated stages with terminal-style logs
 * 4. DEPLOYED  - Command center with quick action grid
 *
 * Author: Mentu Architecture Team
 * Version: 1.0.0
 * Last Updated: 2026-01-05
 *
 * Usage:
 * ```jsx
 * import MentuNavigatorMobile from './mentu-navigator-mobile';
 * function App() {
 *   return <MentuNavigatorMobile />;
 * }
 * ```
 *
 * =============================================================================
 */

import React, { useReducer, useEffect, useRef } from 'react';

// =============================================================================
// SECTION 1: CONSTANTS & CONFIGURATION
// =============================================================================

/**
 * View states for the navigator
 * The flow is: BROWSE -> CONFIRM -> DEPLOYING -> DEPLOYED
 */
const VIEW_STATES = {
  BROWSE: 'browse',
  CONFIRM: 'confirm',
  DEPLOYING: 'deploying',
  DEPLOYED: 'deployed',
};

/**
 * Deployment stages with timing (ms) and display text
 * Each stage represents a step in the deployment process
 */
const DEPLOY_STAGES = [
  { id: 'connect', label: 'Connecting to bridge...', duration: 800 },
  { id: 'validate', label: 'Validating workspace...', duration: 600 },
  { id: 'sync', label: 'Syncing files...', duration: 1200 },
  { id: 'provision', label: 'Provisioning environment...', duration: 1000 },
  { id: 'ready', label: 'Ready', duration: 400 },
];

/**
 * Infrastructure status indicators
 */
const INFRA_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  SYNCING: 'syncing',
  ERROR: 'error',
};

// =============================================================================
// SECTION 2: MOCK DATA
// =============================================================================

/**
 * Mock workspace data representing the Mentu ecosystem repositories
 * In production, this would come from Supabase real-time subscriptions
 */
const MOCK_WORKSPACES = [
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
    hasActivity: true, // For pulse animation
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

/**
 * Mock infrastructure status
 * In production, this would come from health checks and heartbeats
 */
const MOCK_INFRASTRUCTURE = {
  vps: {
    status: INFRA_STATUS.ONLINE,
    label: 'VPS',
    detail: 'mentu-vps-01',
    ip: '208.167.255.71',
  },
  local: {
    status: INFRA_STATUS.ONLINE,
    label: 'Local',
    detail: 'MacBook Pro',
  },
  sync: {
    status: INFRA_STATUS.ONLINE,
    label: 'Sync',
    detail: 'SyncThing',
    lastSync: '30s ago',
  },
};

/**
 * Mock deployment logs for terminal output
 * Simulates realistic deployment feedback
 */
const MOCK_DEPLOY_LOGS = [
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
// SECTION 3: STATE MANAGEMENT (REDUCER PATTERN)
// =============================================================================

/**
 * Action types for the state reducer
 */
const ACTIONS = {
  SET_VIEW: 'SET_VIEW',
  SELECT_WORKSPACE: 'SELECT_WORKSPACE',
  START_DEPLOY: 'START_DEPLOY',
  SET_DEPLOY_STAGE: 'SET_DEPLOY_STAGE',
  ADD_LOG: 'ADD_LOG',
  RESET_LOGS: 'RESET_LOGS',
  DEPLOY_COMPLETE: 'DEPLOY_COMPLETE',
  GO_BACK: 'GO_BACK',
};

/**
 * Initial state for the navigator
 */
const initialState = {
  view: VIEW_STATES.BROWSE,
  selectedWorkspace: null,
  deployStage: 0,
  logs: [],
  isDeploying: false,
};

/**
 * Reducer function handling all state transitions
 * Follows the unidirectional data flow pattern
 *
 * State flow:
 * BROWSE -> (select workspace) -> CONFIRM
 * CONFIRM -> (cancel) -> BROWSE
 * CONFIRM -> (deploy) -> DEPLOYING
 * DEPLOYING -> (complete) -> DEPLOYED
 * DEPLOYED -> (back) -> BROWSE
 */
function navigatorReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_VIEW:
      return { ...state, view: action.payload };

    case ACTIONS.SELECT_WORKSPACE:
      return {
        ...state,
        selectedWorkspace: action.payload,
        view: VIEW_STATES.CONFIRM,
      };

    case ACTIONS.START_DEPLOY:
      return {
        ...state,
        view: VIEW_STATES.DEPLOYING,
        isDeploying: true,
        deployStage: 0,
        logs: [],
      };

    case ACTIONS.SET_DEPLOY_STAGE:
      return { ...state, deployStage: action.payload };

    case ACTIONS.ADD_LOG:
      return { ...state, logs: [...state.logs, action.payload] };

    case ACTIONS.RESET_LOGS:
      return { ...state, logs: [] };

    case ACTIONS.DEPLOY_COMPLETE:
      return {
        ...state,
        view: VIEW_STATES.DEPLOYED,
        isDeploying: false,
        deployStage: DEPLOY_STAGES.length,
      };

    case ACTIONS.GO_BACK:
      // Handle back navigation based on current view
      if (state.view === VIEW_STATES.CONFIRM) {
        return { ...state, view: VIEW_STATES.BROWSE, selectedWorkspace: null };
      }
      if (state.view === VIEW_STATES.DEPLOYED) {
        return { ...state, view: VIEW_STATES.BROWSE, selectedWorkspace: null };
      }
      return state;

    default:
      return state;
  }
}

// =============================================================================
// SECTION 4: CSS-IN-JS STYLES
// =============================================================================

/**
 * Style object containing all CSS-in-JS styles
 * Organized by component for maintainability
 *
 * Design principles:
 * - Mobile-first (375px minimum)
 * - 44x44px touch targets minimum
 * - CSS custom properties for light/dark mode theming
 * - Clean dashboard aesthetic matching existing mentu-web
 */
const styles = {
  // ---------------------------------------------------------------------------
  // Global Container Styles
  // ---------------------------------------------------------------------------
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary, #f8fafc)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: 'var(--text-primary, #0f172a)',
    // CSS custom properties for theming (light mode defaults)
    '--bg-primary': '#f8fafc',
    '--bg-secondary': '#ffffff',
    '--bg-tertiary': '#f1f5f9',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#94a3b8',
    '--border-color': '#e2e8f0',
    '--accent-color': '#0f172a',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--error-color': '#ef4444',
    '--pulse-color': 'rgba(16, 185, 129, 0.4)',
  },

  // ---------------------------------------------------------------------------
  // Header Styles
  // ---------------------------------------------------------------------------
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    position: 'sticky',
    top: 0,
    zIndex: 40,
  },

  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '600px',
    margin: '0 auto',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  logoIcon: {
    width: '28px',
    height: '28px',
    backgroundColor: 'var(--accent-color)',
    borderRadius: '6px',
  },

  logoText: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },

  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    minHeight: '44px', // Touch target
  },

  // ---------------------------------------------------------------------------
  // Infrastructure Bar Styles
  // Shows VPS, Local, Sync status at a glance
  // ---------------------------------------------------------------------------
  infraBar: {
    display: 'flex',
    gap: '12px',
    padding: '12px 20px',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
  },

  infraItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
    minWidth: 'fit-content',
  },

  infraDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },

  infraLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  infraDetail: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },

  // ---------------------------------------------------------------------------
  // Workspace Card Styles
  // Displays individual workspace with activity pulse, stats, Deploy button
  // ---------------------------------------------------------------------------
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },

  // Mobile: single column
  // Tablet+: auto-fill with min 300px

  card: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    padding: '20px',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },

  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  cardIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    position: 'relative',
  },

  cardName: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },

  cardDescription: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },

  // Activity pulse animation indicator - shows workspace has recent activity
  activityPulse: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--success-color)',
    animation: 'pulse 2s infinite',
  },

  cardStats: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },

  cardStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  statIcon: {
    fontSize: '14px',
    opacity: 0.6,
  },

  statValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },

  statLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },

  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
  },

  syncStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },

  deployButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: 'var(--accent-color)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.1s, opacity 0.15s',
    minHeight: '44px', // Touch target size per Apple HIG
    minWidth: '44px',
  },

  // ---------------------------------------------------------------------------
  // Confirm Modal Styles
  // Slide-up sheet pattern common on mobile
  // ---------------------------------------------------------------------------
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 50,
    animation: 'fadeIn 0.2s ease-out',
  },

  modalContent: {
    backgroundColor: 'var(--bg-secondary)',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    animation: 'slideUp 0.3s ease-out',
  },

  // Drag handle for mobile sheet pattern
  modalHandle: {
    width: '40px',
    height: '4px',
    backgroundColor: 'var(--border-color)',
    borderRadius: '2px',
    margin: '12px auto',
  },

  modalHeader: {
    padding: '8px 24px 24px',
    textAlign: 'center',
  },

  modalTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '4px',
    margin: 0,
  },

  modalSubtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '4px 0 0',
  },

  modalBody: {
    padding: '0 24px 24px',
  },

  previewSection: {
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },

  previewLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },

  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--border-color)',
  },

  previewItemLast: {
    borderBottom: 'none',
  },

  previewKey: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },

  previewValue: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  },

  warningBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  warningText: {
    fontSize: '13px',
    color: 'var(--warning-color)',
    fontWeight: 500,
  },

  modalActions: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px 32px',
  },

  cancelButton: {
    flex: 1,
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-tertiary)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    minHeight: '52px',
  },

  confirmButton: {
    flex: 2,
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: 'var(--accent-color)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    minHeight: '52px',
  },

  // ---------------------------------------------------------------------------
  // Deploying View Styles
  // Animated stages with terminal-style log output
  // ---------------------------------------------------------------------------
  deployingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
  },

  deployingContent: {
    flex: 1,
    padding: '24px 20px',
    maxWidth: '500px',
    margin: '0 auto',
    width: '100%',
  },

  deployingHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },

  deployingTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px',
    margin: 0,
  },

  deployingSubtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '8px 0 0',
  },

  stagesContainer: {
    marginBottom: '24px',
  },

  stage: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 0',
    position: 'relative',
  },

  // Vertical connector line between stages
  stageConnector: {
    position: 'absolute',
    left: '15px',
    top: '40px',
    width: '2px',
    height: 'calc(100% - 24px)',
    backgroundColor: 'var(--border-color)',
  },

  stageConnectorActive: {
    backgroundColor: 'var(--success-color)',
  },

  stageIndicator: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    flexShrink: 0,
    transition: 'all 0.3s ease',
    zIndex: 1,
  },

  stageIndicatorPending: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-muted)',
    border: '2px solid var(--border-color)',
  },

  stageIndicatorActive: {
    backgroundColor: 'var(--accent-color)',
    color: '#ffffff',
    animation: 'spinnerPulse 1s infinite',
  },

  stageIndicatorComplete: {
    backgroundColor: 'var(--success-color)',
    color: '#ffffff',
  },

  stageLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    transition: 'color 0.2s',
  },

  stageLabelActive: {
    color: 'var(--text-primary)',
    fontWeight: 500,
  },

  stageLabelComplete: {
    color: 'var(--success-color)',
  },

  // Terminal log output - mimics real terminal aesthetics
  terminalContainer: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
  },

  terminalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#1e293b',
  },

  terminalDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },

  terminalTitle: {
    fontSize: '12px',
    color: '#94a3b8',
    marginLeft: 'auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },

  terminalBody: {
    padding: '16px',
    maxHeight: '200px',
    overflowY: 'auto',
    fontSize: '12px',
    lineHeight: 1.6,
  },

  logLine: {
    display: 'flex',
    gap: '12px',
    marginBottom: '4px',
  },

  logTime: {
    color: '#64748b',
    flexShrink: 0,
  },

  logMessageInfo: {
    color: '#94a3b8',
  },

  logMessageSuccess: {
    color: '#10b981',
  },

  logMessageError: {
    color: '#ef4444',
  },

  // ---------------------------------------------------------------------------
  // Deployed (Command Center) Styles
  // Quick action grid for immediate workspace operations
  // ---------------------------------------------------------------------------
  deployedContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
  },

  deployedContent: {
    flex: 1,
    padding: '24px 20px',
    maxWidth: '500px',
    margin: '0 auto',
    width: '100%',
  },

  successBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--success-color)',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '16px',
  },

  deployedHeader: {
    marginBottom: '32px',
  },

  deployedTitle: {
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px',
    margin: 0,
  },

  deployedSubtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '8px 0 0',
  },

  // 2x2 grid of quick actions
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },

  actionCard: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.1s',
    minHeight: '120px',
  },

  actionIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },

  actionIconTerminal: {
    backgroundColor: '#0f172a',
  },

  actionIconKanban: {
    backgroundColor: '#dbeafe',
  },

  actionIconSpawn: {
    backgroundColor: '#dcfce7',
  },

  actionIconWork: {
    backgroundColor: '#fef3c7',
  },

  actionLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    textAlign: 'center',
  },

  actionDescription: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
};

// =============================================================================
// SECTION 5: KEYFRAME ANIMATIONS
// =============================================================================

/**
 * CSS keyframe animations injected via style tag
 * Includes reduced-motion support for accessibility
 */
const keyframes = `
  /* Activity pulse - shows workspace has recent activity */
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.5);
      opacity: 0.5;
    }
  }

  /* Modal overlay fade in */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Modal content slide up from bottom */
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  /* Active stage indicator pulse */
  @keyframes spinnerPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  /* Log line typewriter effect */
  @keyframes typewriter {
    from {
      opacity: 0;
      transform: translateX(-4px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* ACCESSIBILITY: Respect reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* DARK MODE: Override CSS custom properties */
  @media (prefers-color-scheme: dark) {
    .navigator-container {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-tertiary: #334155;
      --text-primary: #f8fafc;
      --text-secondary: #cbd5e1;
      --text-muted: #64748b;
      --border-color: #334155;
      --accent-color: #f8fafc;
    }
  }

  /* Dark mode class override (for manual toggle) */
  .navigator-container.dark {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #64748b;
    --border-color: #334155;
    --accent-color: #f8fafc;
  }
`;

// =============================================================================
// SECTION 6: SUB-COMPONENTS
// =============================================================================

/**
 * InfrastructureBar Component
 *
 * Displays real-time status of infrastructure:
 * - VPS: Remote server status (mentu-vps-01)
 * - Local: Mac/development machine status
 * - Sync: SyncThing bidirectional sync status
 *
 * Props: infrastructure - object with vps, local, sync status objects
 */
function InfrastructureBar({ infrastructure }) {
  /**
   * Get status indicator color based on status enum
   */
  const getStatusColor = (status) => {
    switch (status) {
      case INFRA_STATUS.ONLINE:
        return '#10b981'; // Green
      case INFRA_STATUS.OFFLINE:
        return '#ef4444'; // Red
      case INFRA_STATUS.SYNCING:
        return '#f59e0b'; // Amber (animated)
      case INFRA_STATUS.ERROR:
        return '#ef4444'; // Red
      default:
        return '#94a3b8'; // Gray
    }
  };

  return (
    <div style={styles.infraBar}>
      {Object.entries(infrastructure).map(([key, infra]) => (
        <div key={key} style={styles.infraItem}>
          <div
            style={{
              ...styles.infraDot,
              backgroundColor: getStatusColor(infra.status),
              // Add pulse animation for syncing status
              animation: infra.status === INFRA_STATUS.SYNCING ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          <span style={styles.infraLabel}>{infra.label}</span>
          <span style={styles.infraDetail}>{infra.detail}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * WorkspaceCard Component
 *
 * Displays individual workspace with:
 * - Activity pulse indicator (green dot for active workspaces)
 * - Agent count and open work count
 * - Sync status
 * - Deploy button (44x44px touch target)
 *
 * Props:
 * - workspace: workspace data object
 * - onDeploy: callback when Deploy button clicked
 */
function WorkspaceCard({ workspace, onDeploy }) {
  const handleDeployClick = (e) => {
    e.stopPropagation();
    onDeploy(workspace);
  };

  return (
    <div
      style={styles.card}
      onClick={() => onDeploy(workspace)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onDeploy(workspace)}
      aria-label={`${workspace.name} workspace. ${workspace.activeAgents} agents, ${workspace.openWork} work items.`}
    >
      {/* Card Header */}
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>
          <div style={styles.cardIcon}>
            {/* Activity pulse for active workspaces */}
            {workspace.hasActivity && (
              <div style={styles.activityPulse} aria-label="Active" />
            )}
            <span role="img" aria-hidden="true">
              {workspace.type === 'local' ? '📁' : '🌐'}
            </span>
          </div>
          <div>
            <h3 style={styles.cardName}>{workspace.name}</h3>
            <p style={styles.cardDescription}>{workspace.description}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.cardStats}>
        <div style={styles.cardStat}>
          <span style={styles.statIcon} role="img" aria-hidden="true">
            🤖
          </span>
          <span style={styles.statValue}>{workspace.activeAgents}</span>
          <span style={styles.statLabel}>agents</span>
        </div>
        <div style={styles.cardStat}>
          <span style={styles.statIcon} role="img" aria-hidden="true">
            📋
          </span>
          <span style={styles.statValue}>{workspace.openWork}</span>
          <span style={styles.statLabel}>work</span>
        </div>
        <div style={styles.cardStat}>
          <span style={styles.statLabel}>{workspace.lastActivity}</span>
        </div>
      </div>

      {/* Footer with sync status and deploy button */}
      <div style={styles.cardFooter}>
        <div style={styles.syncStatus}>
          <span
            style={{
              ...styles.infraDot,
              width: '6px',
              height: '6px',
              backgroundColor: workspace.synced ? '#10b981' : '#f59e0b',
            }}
          />
          {workspace.synced ? 'Synced' : 'Pending sync'}
        </div>
        <button
          style={styles.deployButton}
          onClick={handleDeployClick}
          aria-label={`Deploy ${workspace.name}`}
        >
          Deploy
        </button>
      </div>
    </div>
  );
}

/**
 * ConfirmModal Component
 *
 * Slide-up modal showing deployment preview before confirming.
 * Displays:
 * - Workspace name and description
 * - Local and VPS paths
 * - Current status (agents, work items, sync)
 * - Warning if agents are already running
 *
 * Props:
 * - workspace: selected workspace to deploy
 * - onConfirm: callback when Deploy Now clicked
 * - onCancel: callback when Cancel clicked or overlay tapped
 */
function ConfirmModal({ workspace, onConfirm, onCancel }) {
  if (!workspace) return null;

  // Check if we should show warning about running agents
  const hasRunningAgents = workspace.activeAgents > 0;

  return (
    <div
      style={styles.modalOverlay}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        style={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Drag handle for mobile sheet pattern */}
        <div style={styles.modalHandle} aria-hidden="true" />

        {/* Header */}
        <div style={styles.modalHeader}>
          <h2 id="modal-title" style={styles.modalTitle}>
            Deploy Workspace
          </h2>
          <p style={styles.modalSubtitle}>Review before connecting</p>
        </div>

        {/* Body with preview information */}
        <div style={styles.modalBody}>
          {/* Warning banner if agents are running */}
          {hasRunningAgents && (
            <div style={styles.warningBanner}>
              <span role="img" aria-hidden="true">⚠️</span>
              <span style={styles.warningText}>
                {workspace.activeAgents} agent{workspace.activeAgents > 1 ? 's' : ''} currently running
              </span>
            </div>
          )}

          {/* Workspace Info */}
          <div style={styles.previewSection}>
            <div style={styles.previewLabel}>Workspace</div>
            <div style={styles.previewItem}>
              <span style={styles.previewKey}>Name</span>
              <span style={styles.previewValue}>{workspace.name}</span>
            </div>
            <div style={{ ...styles.previewItem, ...styles.previewItemLast }}>
              <span style={styles.previewKey}>Description</span>
              <span style={styles.previewValue}>{workspace.description}</span>
            </div>
          </div>

          {/* Path Info */}
          <div style={styles.previewSection}>
            <div style={styles.previewLabel}>Paths</div>
            <div style={styles.previewItem}>
              <span style={styles.previewKey}>Local</span>
              <span
                style={{
                  ...styles.previewValue,
                  fontSize: '11px',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={workspace.path}
              >
                {workspace.path}
              </span>
            </div>
            <div style={{ ...styles.previewItem, ...styles.previewItemLast }}>
              <span style={styles.previewKey}>VPS</span>
              <span
                style={{
                  ...styles.previewValue,
                  fontSize: '11px',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={workspace.vpsPath}
              >
                {workspace.vpsPath}
              </span>
            </div>
          </div>

          {/* Status Info */}
          <div style={styles.previewSection}>
            <div style={styles.previewLabel}>Status</div>
            <div style={styles.previewItem}>
              <span style={styles.previewKey}>Active Agents</span>
              <span
                style={{
                  ...styles.previewValue,
                  color: workspace.activeAgents > 0 ? '#f59e0b' : 'inherit',
                }}
              >
                {workspace.activeAgents}
              </span>
            </div>
            <div style={styles.previewItem}>
              <span style={styles.previewKey}>Open Work</span>
              <span style={styles.previewValue}>{workspace.openWork}</span>
            </div>
            <div style={{ ...styles.previewItem, ...styles.previewItemLast }}>
              <span style={styles.previewKey}>Sync Status</span>
              <span
                style={{
                  ...styles.previewValue,
                  color: workspace.synced ? '#10b981' : '#f59e0b',
                }}
              >
                {workspace.synced ? '✓ Synced' : '⟳ Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={styles.modalActions}>
          <button
            style={styles.cancelButton}
            onClick={onCancel}
            aria-label="Cancel deployment"
          >
            Cancel
          </button>
          <button
            style={styles.confirmButton}
            onClick={onConfirm}
            aria-label={`Deploy ${workspace.name}`}
          >
            Deploy Now
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * DeployingView Component
 *
 * Shows animated deployment progress with:
 * - 5 stages (connect, validate, sync, provision, ready)
 * - Stage indicators (pending/active/complete)
 * - Vertical connector lines
 * - Terminal-style log output with timestamps
 *
 * Props:
 * - workspace: workspace being deployed
 * - stage: current stage index (0-4)
 * - logs: array of log objects with time, level, message
 */
function DeployingView({ workspace, stage, logs }) {
  const terminalRef = useRef(null);

  // Auto-scroll terminal to bottom when new logs added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  /**
   * Determine stage status based on current stage index
   */
  const getStageStatus = (index) => {
    if (index < stage) return 'complete';
    if (index === stage) return 'active';
    return 'pending';
  };

  /**
   * Get stage indicator styles based on status
   */
  const getStageIndicatorStyle = (status) => {
    switch (status) {
      case 'complete':
        return { ...styles.stageIndicator, ...styles.stageIndicatorComplete };
      case 'active':
        return { ...styles.stageIndicator, ...styles.stageIndicatorActive };
      default:
        return { ...styles.stageIndicator, ...styles.stageIndicatorPending };
    }
  };

  /**
   * Get stage label styles based on status
   */
  const getStageLabelStyle = (status) => {
    switch (status) {
      case 'complete':
        return { ...styles.stageLabel, ...styles.stageLabelComplete };
      case 'active':
        return { ...styles.stageLabel, ...styles.stageLabelActive };
      default:
        return styles.stageLabel;
    }
  };

  return (
    <div style={styles.deployingContainer}>
      <div style={styles.deployingContent}>
        {/* Header */}
        <div style={styles.deployingHeader}>
          <h1 style={styles.deployingTitle}>Deploying</h1>
          <p style={styles.deployingSubtitle}>{workspace?.name}</p>
        </div>

        {/* Stages */}
        <div style={styles.stagesContainer} role="progressbar" aria-valuenow={stage} aria-valuemax={DEPLOY_STAGES.length}>
          {DEPLOY_STAGES.map((stageItem, index) => {
            const status = getStageStatus(index);
            const isLast = index === DEPLOY_STAGES.length - 1;

            return (
              <div key={stageItem.id} style={styles.stage}>
                {/* Connector line between stages */}
                {!isLast && (
                  <div
                    style={{
                      ...styles.stageConnector,
                      ...(status === 'complete' ? styles.stageConnectorActive : {}),
                    }}
                    aria-hidden="true"
                  />
                )}

                {/* Stage indicator (circle) */}
                <div
                  style={getStageIndicatorStyle(status)}
                  aria-hidden="true"
                >
                  {status === 'complete' ? (
                    '✓'
                  ) : status === 'active' ? (
                    <span style={{ display: 'inline-block' }}>•</span>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Stage label */}
                <span style={getStageLabelStyle(status)}>
                  {stageItem.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Terminal output */}
        <div style={styles.terminalContainer} role="log" aria-live="polite" aria-label="Deployment logs">
          <div style={styles.terminalHeader}>
            <div style={{ ...styles.terminalDot, backgroundColor: '#ef4444' }} />
            <div style={{ ...styles.terminalDot, backgroundColor: '#f59e0b' }} />
            <div style={{ ...styles.terminalDot, backgroundColor: '#10b981' }} />
            <span style={styles.terminalTitle}>deploy.log</span>
          </div>
          <div style={styles.terminalBody} ref={terminalRef}>
            {logs.map((log, index) => (
              <div
                key={index}
                style={{
                  ...styles.logLine,
                  animation: 'typewriter 0.2s ease-out',
                }}
              >
                <span style={styles.logTime}>{log.time}</span>
                <span
                  style={
                    log.level === 'success'
                      ? styles.logMessageSuccess
                      : log.level === 'error'
                      ? styles.logMessageError
                      : styles.logMessageInfo
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
            {/* Blinking cursor */}
            <span
              style={{
                color: '#10b981',
                animation: 'pulse 1s infinite',
              }}
              aria-hidden="true"
            >
              ▋
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * DeployedView Component
 *
 * Command center shown after successful deployment.
 * Quick action grid with 4 actions:
 * - Terminal: Open Claude Code session
 * - Kanban: View work board
 * - Spawn Agent: Create new agent
 * - New Work: Create commitment
 *
 * Props:
 * - workspace: deployed workspace
 * - onAction: callback when action clicked (receives action id)
 * - onBack: callback to return to browse view
 */
function DeployedView({ workspace, onAction, onBack }) {
  /**
   * Quick action definitions
   */
  const actions = [
    {
      id: 'terminal',
      label: 'Terminal',
      description: 'Open Claude Code',
      icon: '⌨️',
      iconStyle: styles.actionIconTerminal,
    },
    {
      id: 'kanban',
      label: 'Kanban',
      description: 'View work board',
      icon: '📊',
      iconStyle: styles.actionIconKanban,
    },
    {
      id: 'spawn',
      label: 'Spawn Agent',
      description: 'Create new agent',
      icon: '🤖',
      iconStyle: styles.actionIconSpawn,
    },
    {
      id: 'work',
      label: 'New Work',
      description: 'Create commitment',
      icon: '✨',
      iconStyle: styles.actionIconWork,
    },
  ];

  return (
    <div style={styles.deployedContainer}>
      {/* Header with back button */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <button
            style={styles.backButton}
            onClick={onBack}
            aria-label="Back to workspaces"
          >
            ← Back
          </button>
          <div style={styles.logo}>
            <div style={styles.logoIcon} />
            <span style={styles.logoText}>mentu</span>
          </div>
        </div>
      </div>

      <div style={styles.deployedContent}>
        {/* Success badge */}
        <div style={styles.successBadge}>
          <span aria-hidden="true">✓</span>
          <span>Connected</span>
        </div>

        {/* Header */}
        <div style={styles.deployedHeader}>
          <h1 style={styles.deployedTitle}>{workspace?.name}</h1>
          <p style={styles.deployedSubtitle}>
            Ready for work • {workspace?.activeAgents} agent{workspace?.activeAgents !== 1 ? 's' : ''} active
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div style={styles.actionGrid} role="group" aria-label="Quick actions">
          {actions.map((action) => (
            <button
              key={action.id}
              style={styles.actionCard}
              onClick={() => onAction(action.id)}
              aria-label={`${action.label}: ${action.description}`}
            >
              <div
                style={{
                  ...styles.actionIcon,
                  ...action.iconStyle,
                }}
                aria-hidden="true"
              >
                <span role="img" aria-hidden="true">
                  {action.icon}
                </span>
              </div>
              <div>
                <div style={styles.actionLabel}>{action.label}</div>
                <div style={styles.actionDescription}>{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SECTION 7: MAIN COMPONENT
// =============================================================================

/**
 * MentuNavigatorMobile
 *
 * Main component implementing the 4-state deploy flow:
 * BROWSE -> CONFIRM -> DEPLOYING -> DEPLOYED
 *
 * State machine:
 * - BROWSE: Initial state, shows workspace cards
 * - CONFIRM: User selected workspace, shows confirmation modal
 * - DEPLOYING: Deployment in progress, shows stages and logs
 * - DEPLOYED: Deployment complete, shows command center
 *
 * Transitions:
 * - SELECT_WORKSPACE: BROWSE -> CONFIRM
 * - GO_BACK: CONFIRM -> BROWSE
 * - START_DEPLOY: CONFIRM -> DEPLOYING
 * - DEPLOY_COMPLETE: DEPLOYING -> DEPLOYED
 * - GO_BACK: DEPLOYED -> BROWSE
 */
function MentuNavigatorMobile() {
  const [state, dispatch] = useReducer(navigatorReducer, initialState);
  const { view, selectedWorkspace, deployStage, logs } = state;

  // ---------------------------------------------------------------------------
  // Deployment simulation effect
  // In production, this would be replaced with actual bridge/Supabase calls
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (view !== VIEW_STATES.DEPLOYING) return;

    let currentStage = 0;
    let logIndex = 0;
    let stageTimerId = null;
    let logTimerId = null;

    /**
     * Add logs progressively to simulate real-time output
     */
    const addLogs = () => {
      if (logIndex < MOCK_DEPLOY_LOGS.length) {
        dispatch({ type: ACTIONS.ADD_LOG, payload: MOCK_DEPLOY_LOGS[logIndex] });
        logIndex++;
      }
    };

    /**
     * Progress through deployment stages
     */
    const progressStage = () => {
      if (currentStage < DEPLOY_STAGES.length) {
        dispatch({ type: ACTIONS.SET_DEPLOY_STAGE, payload: currentStage });

        // Add 2-3 logs per stage
        addLogs();
        setTimeout(addLogs, 200);
        setTimeout(addLogs, 400);

        currentStage++;
        stageTimerId = setTimeout(progressStage, DEPLOY_STAGES[currentStage - 1]?.duration || 800);
      } else {
        // All stages complete, add remaining logs then transition
        const finishLogs = () => {
          if (logIndex < MOCK_DEPLOY_LOGS.length) {
            addLogs();
            logTimerId = setTimeout(finishLogs, 100);
          } else {
            // Transition to deployed state after small delay
            setTimeout(() => {
              dispatch({ type: ACTIONS.DEPLOY_COMPLETE });
            }, 500);
          }
        };
        finishLogs();
      }
    };

    // Start deployment simulation
    progressStage();

    // Cleanup on unmount or view change
    return () => {
      if (stageTimerId) clearTimeout(stageTimerId);
      if (logTimerId) clearTimeout(logTimerId);
    };
  }, [view]);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle workspace selection - transitions to CONFIRM state
   */
  const handleSelectWorkspace = (workspace) => {
    dispatch({ type: ACTIONS.SELECT_WORKSPACE, payload: workspace });
  };

  /**
   * Handle deployment confirmation - transitions to DEPLOYING state
   */
  const handleConfirmDeploy = () => {
    dispatch({ type: ACTIONS.START_DEPLOY });
  };

  /**
   * Handle cancel - returns to BROWSE state
   */
  const handleCancel = () => {
    dispatch({ type: ACTIONS.GO_BACK });
  };

  /**
   * Handle quick action selection in deployed view
   * In production, these would navigate or trigger actual operations
   */
  const handleAction = (actionId) => {
    console.log(`Action triggered: ${actionId}`);

    // Placeholder implementations - would integrate with actual functionality
    switch (actionId) {
      case 'terminal':
        // Would open Claude Code session via bridge
        console.log('Opening Claude Code terminal...');
        break;
      case 'kanban':
        // Would navigate to kanban board
        console.log('Navigating to Kanban board...');
        break;
      case 'spawn':
        // Would open agent spawn dialog
        console.log('Opening agent spawn dialog...');
        break;
      case 'work':
        // Would open new commitment form
        console.log('Creating new commitment...');
        break;
      default:
        break;
    }
  };

  /**
   * Handle back navigation from deployed view
   */
  const handleBack = () => {
    dispatch({ type: ACTIONS.GO_BACK });
  };

  // ---------------------------------------------------------------------------
  // Render based on current view state
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Inject keyframe animations */}
      <style>{keyframes}</style>

      <div style={styles.container} className="navigator-container">
        {/* ================================================================= */}
        {/* BROWSE STATE: Show workspace grid                                  */}
        {/* ================================================================= */}
        {view === VIEW_STATES.BROWSE && (
          <>
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerContent}>
                <div style={styles.logo}>
                  <div style={styles.logoIcon} />
                  <span style={styles.logoText}>mentu</span>
                </div>
              </div>
            </div>

            {/* Infrastructure status bar */}
            <InfrastructureBar infrastructure={MOCK_INFRASTRUCTURE} />

            {/* Workspace card grid */}
            <div style={styles.cardGrid}>
              {MOCK_WORKSPACES.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onDeploy={handleSelectWorkspace}
                />
              ))}
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* CONFIRM STATE: Show confirmation modal over browse view           */}
        {/* ================================================================= */}
        {view === VIEW_STATES.CONFIRM && (
          <>
            {/* Keep browse view visible behind modal for context */}
            <div style={styles.header}>
              <div style={styles.headerContent}>
                <div style={styles.logo}>
                  <div style={styles.logoIcon} />
                  <span style={styles.logoText}>mentu</span>
                </div>
              </div>
            </div>
            <InfrastructureBar infrastructure={MOCK_INFRASTRUCTURE} />
            <div style={styles.cardGrid}>
              {MOCK_WORKSPACES.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onDeploy={handleSelectWorkspace}
                />
              ))}
            </div>

            {/* Modal overlay */}
            <ConfirmModal
              workspace={selectedWorkspace}
              onConfirm={handleConfirmDeploy}
              onCancel={handleCancel}
            />
          </>
        )}

        {/* ================================================================= */}
        {/* DEPLOYING STATE: Show deployment progress                         */}
        {/* ================================================================= */}
        {view === VIEW_STATES.DEPLOYING && (
          <DeployingView
            workspace={selectedWorkspace}
            stage={deployStage}
            logs={logs}
          />
        )}

        {/* ================================================================= */}
        {/* DEPLOYED STATE: Show command center                               */}
        {/* ================================================================= */}
        {view === VIEW_STATES.DEPLOYED && (
          <DeployedView
            workspace={selectedWorkspace}
            onAction={handleAction}
            onBack={handleBack}
          />
        )}
      </div>
    </>
  );
}

// =============================================================================
// SECTION 8: EXPORTS
// =============================================================================

// Default export - main component
export default MentuNavigatorMobile;

// Named exports for individual components (useful for testing/storybook)
export {
  // Components
  InfrastructureBar,
  WorkspaceCard,
  ConfirmModal,
  DeployingView,
  DeployedView,
  // Constants
  VIEW_STATES,
  DEPLOY_STAGES,
  INFRA_STATUS,
  // State management
  navigatorReducer,
  ACTIONS,
  initialState,
  // Mock data (for testing/development)
  MOCK_WORKSPACES,
  MOCK_INFRASTRUCTURE,
  MOCK_DEPLOY_LOGS,
};
