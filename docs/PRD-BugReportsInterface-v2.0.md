---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PRD-BugReportsInterface-v2.0
path: docs/PRD-BugReportsInterface-v2.0.md
type: prd
intent: reference
version: "2.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T3

children:
  - HANDOFF-BugReportsInterface-v2.0
dependencies:
  - PRD-BugReportsInterface-v1.0
  - mentu-ai/supabase/functions/mentu-api/index.ts
  - mentu-proxy/src/index.ts

# Cross-repo references
cross_repo:
  mentu_api: /Users/rashid/Desktop/Workspaces/mentu-ai/supabase/functions/mentu-api/index.ts
  bug_reporter: /Users/rashid/Desktop/Workspaces/projects/inline-substitute/vin-to-value-main/src/features/bug-reporter/

mentu:
  commitment: cmt_4ecbba4f
  status: pending
---

# PRD: Bug Reports Interface v2.0

## Mission

Complete the bug reports pipeline by fixing the data flow from WarrantyOS to Mentu display. Currently, bug reports arrive with incomplete data (no diagnostic_data, no screenshots) because the Mentu API strips non-standard fields and WarrantyOS doesn't send screenshot binaries. This PRD addresses the full end-to-end data flow.

---

## Problem Statement

### Current State

```
WarrantyOS                     Mentu API                    Mentu Web
─────────────────────────────────────────────────────────────────────────
BugReporterService             POST /ops (capture)          useBugReports
  └── sends:                     └── stores:                  └── reads:
      - body ✓                       - body ✓                     - body ✓
      - kind ✓                       - kind ✓                     - kind ✓
      - meta ✓                       - meta ✓                     - meta ✓
      - diagnostic_data ✗            [IGNORED!]                   - diagnostic_data (null!)
      - has_screenshot: true         [FLAG ONLY]                  - screenshot (null!)
```

**Issues Identified:**

1. **Mentu API (mentu-ai/supabase/functions/mentu-api/index.ts:391)**
   - Line 391: `payload: { body: body.body || '', kind: body.kind, meta: body.meta }`
   - Completely ignores `diagnostic_data`, `tags`, `priority`, `refs`

2. **WarrantyOS (bugReporterService.ts)**
   - Sends `has_screenshot: true` flag but NOT the actual screenshot data
   - Screenshot is a base64 string that should be uploaded to storage

3. **mentu-web (useBugReports.ts)**
   - Tries to extract `diagnostic_data` from payload but it's never stored
   - Has the display components but no data to display

4. **RightPanelProvider Error**
   - Components using `useRightPanel()` outside provider context
   - Likely from a component not wrapped in the plane layout

### Desired State

```
WarrantyOS                     Mentu API                    Mentu Web
─────────────────────────────────────────────────────────────────────────
BugReporterService             POST /ops (capture)          useBugReports
  └── sends:                     └── stores:                  └── displays:
      - body ✓                       - body ✓                     - Description ✓
      - kind ✓                       - kind ✓                     - Environment ✓
      - meta ✓                       - meta ✓                     - Console Logs ✓
      - diagnostic_data ✓            - diagnostic_data ✓          - Behavior Trace ✓
      - screenshot_url ✓             - screenshot_url ✓           - Screenshot Image ✓
      (uploaded separately)          (in meta)                    - Element Info ✓
```

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "BugReportsInterface-v2.0",
  "tier": "T3",
  "required_files": [
    "mentu-ai/supabase/functions/mentu-api/index.ts",
    "mentu-proxy/src/handlers/bug-screenshot.ts",
    "mentu-web/src/hooks/useBugReports.ts",
    "mentu-web/src/components/bug-report/bug-report-detail.tsx",
    "mentu-web/src/components/bug-report/screenshot-viewer.tsx"
  ],
  "checks": {
    "tsc": true,
    "build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 100
}
```

---

## Core Concepts

### Diagnostic Data Passthrough

The Mentu API must store ALL fields from capture operations, not just a whitelist. The payload should be opaque to the API layer.

```typescript
// BEFORE (current - broken)
payload: { body: body.body || '', kind: body.kind, meta: body.meta }

// AFTER (fixed)
payload: {
  body: body.body || '',
  kind: body.kind,
  meta: body.meta,
  diagnostic_data: body.diagnostic_data,  // Console logs, behavior trace
  tags: body.tags,
  priority: body.priority,
  refs: body.refs,
}
```

### Screenshot Upload Flow

Screenshots should be uploaded to Supabase Storage, not embedded in JSON payloads (too large, 6MB+ for base64).

```
WarrantyOS                    Mentu Proxy                  Supabase Storage
─────────────────────────────────────────────────────────────────────────
1. Capture screenshot
2. POST /bug-screenshot       → Upload to storage      → bug-screenshots/{id}.png
   (base64 data)               ← Return public URL
3. POST /ops (capture)
   (with screenshot_url)      → Store URL in meta
```

### Dynamic Data Display

The bug report detail view must handle ALL possible data fields dynamically, not assume a fixed structure.

```typescript
// Display any meta fields that exist
Object.entries(bug.environment || {}).map(([key, value]) => (
  <MetaItem key={key} label={key} value={value} />
))
```

---

## Specification

### Types

```typescript
// Extended capture payload (what WarrantyOS sends)
interface ExtendedCapturePayload {
  body: string;
  kind: string;
  meta?: Record<string, unknown>;
  diagnostic_data?: {
    console_logs?: ConsoleLog[];
    behavior_trace?: BehaviorEvent[];
    selected_element?: SelectedElement;
  };
  tags?: string[];
  priority?: string;
  refs?: string[];
}

// Screenshot upload request
interface ScreenshotUploadRequest {
  bug_id: string;           // Memory ID or temp ID
  screenshot: string;       // Base64 encoded image
  content_type?: string;    // Default: image/png
}

// Screenshot upload response
interface ScreenshotUploadResponse {
  url: string;              // Public URL to the screenshot
  path: string;             // Storage path
}
```

### Operations

| Operation | Endpoint | Input | Output | Description |
|-----------|----------|-------|--------|-------------|
| Upload Screenshot | `POST /bug-screenshot` | `ScreenshotUploadRequest` | `ScreenshotUploadResponse` | Upload screenshot to storage |
| Capture Bug | `POST /ops` | `ExtendedCapturePayload` | `Operation` | Store bug with all data |

### Data Flow

```
1. User submits bug in WarrantyOS
   ↓
2. If screenshot exists:
   POST /bug-screenshot (base64) → Storage → Returns URL
   ↓
3. POST /ops with:
   - body (description)
   - kind: "bug"
   - meta (environment, screenshot_url)
   - diagnostic_data (console logs, behavior trace)
   ↓
4. Mentu API stores COMPLETE payload in operations table
   ↓
5. Real-time subscription updates mentu-web
   ↓
6. useBugReports extracts data from payload
   ↓
7. BugReportDetail displays all data including:
   - Screenshot image (from URL)
   - Console logs (from diagnostic_data)
   - Behavior trace (from diagnostic_data)
   - Environment (from meta)
```

---

## Implementation

### Deliverables

| File | Repo | Purpose |
|------|------|---------|
| `supabase/functions/mentu-api/index.ts` | mentu-ai | Store complete capture payload |
| `src/handlers/bug-screenshot.ts` | mentu-proxy | Handle screenshot upload |
| `src/index.ts` | mentu-proxy | Add screenshot upload route |
| `src/hooks/useBugReports.ts` | mentu-web | Extract all diagnostic data |
| `src/components/bug-report/bug-report-detail.tsx` | mentu-web | Display screenshot and all data |
| `src/components/bug-report/screenshot-viewer.tsx` | mentu-web | Screenshot image component |

### Build Order

1. **Fix Mentu API** (mentu-ai)
   - Modify capture handler to store complete payload
   - Deploy edge function

2. **Add Screenshot Upload** (mentu-proxy)
   - Create handler for base64 → storage upload
   - Add route to index.ts
   - Deploy worker

3. **Update WarrantyOS** (projects/inline-substitute)
   - Upload screenshot before capture
   - Include screenshot_url in meta
   - Verify diagnostic_data is sent

4. **Enhance Display** (mentu-web)
   - Update useBugReports to handle new data structure
   - Create ScreenshotViewer component
   - Update BugReportDetail to show screenshot
   - Fix RightPanelProvider scope issue

### Cross-Repo Changes

| Repo | Changes Required |
|------|------------------|
| mentu-ai | Update edge function to store complete payload |
| mentu-proxy | Add screenshot upload endpoint |
| projects/inline-substitute | Upload screenshot, include URL in capture |
| mentu-web | Display screenshot, fix provider error |

---

## Constraints

- **No breaking changes**: Existing bug reports must still display
- **Storage limit**: Screenshots max 5MB (resize if larger)
- **Public URLs**: Use signed URLs or public bucket for screenshots
- **No new tables**: Use operations table and Supabase Storage
- **RLS**: Screenshots bucket must allow authenticated uploads

---

## Success Criteria

### Functional

- [ ] Bug reports show screenshot images in detail view
- [ ] Console logs display with colored severity levels
- [ ] Behavior trace shows user interactions
- [ ] Selected element info displays if present
- [ ] All environment fields display dynamically
- [ ] Real-time updates work for new bug reports
- [ ] RightPanelProvider error is fixed

### Quality

- [ ] All files compile without errors (`tsc --noEmit`)
- [ ] Build passes in all three repos
- [ ] Screenshot upload handles errors gracefully
- [ ] Large screenshots are resized before upload

### Integration

- [ ] End-to-end flow works: WarrantyOS → API → Display
- [ ] Existing bug reports without screenshots still display
- [ ] Real-time subscription includes new data fields

---

## Verification Commands

```bash
# Verify mentu-ai edge function
cd mentu-ai && supabase functions serve mentu-api

# Verify mentu-proxy
cd mentu-proxy && npx wrangler dev

# Verify mentu-web
cd mentu-web && npm run build

# Test screenshot upload
curl -X POST "https://mentu-proxy.affihub.workers.dev/bug-screenshot" \
  -H "X-Proxy-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bug_id": "test", "screenshot": "base64..."}'

# Check Mentu state
mentu list memories --kind bug --limit 1 --json | jq '.memories[0].payload'
```

---

## References

- `PRD-BugReportsInterface-v1.0`: Previous version (UI only)
- `mentu-ai/supabase/functions/mentu-api/index.ts`: Current API (broken)
- `projects/inline-substitute/.../bugReporterService.ts`: WarrantyOS client
- `mentu-web/src/hooks/useBugReports.ts`: Current hook
- `mentu-web/src/components/bug-report/`: Current display components

---

*This PRD fixes the data pipeline to enable full diagnostic visibility for bug reports.*
