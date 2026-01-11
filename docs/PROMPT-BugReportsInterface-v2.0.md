---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PROMPT-BugReportsInterface-v2.0
path: docs/PROMPT-BugReportsInterface-v2.0.md
type: prompt
intent: execute
version: "2.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T3
actor: (from manifest)

parent: HANDOFF-BugReportsInterface-v2.0

mentu:
  commitment: cmt_4ecbba4f
  status: pending
---

# Executable Prompts: Bug Reports Interface v2.0

This implementation spans three codebases. Each prompt is for a separate coding agent.

---

## Prompt 1: mentu-proxy (Screenshot Upload)

**Directory**: `/Users/rashid/Desktop/Workspaces/mentu-proxy`

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 30 \
  "
# MISSION
Add screenshot upload endpoint to mentu-proxy.

# CONTEXT
Bug reports from WarrantyOS need to upload screenshots to Supabase Storage before
capturing the bug. Screenshots are too large for JSON payloads (5MB+ base64).

# DELIVERABLES
1. Create src/handlers/bug-screenshot.ts with:
   - Accept POST with { bug_id: string, screenshot: string (base64) }
   - Validate base64 data and size (max 5MB)
   - Upload to Supabase Storage bucket 'bug-attachments'
   - Return { url: string, path: string }

2. Add route in src/index.ts:
   - POST /bug-screenshot (requires X-Proxy-Token auth)

3. Create storage bucket SQL (output only, don't execute):
   - INSERT INTO storage.buckets for 'bug-attachments' (public: true)
   - RLS policies for authenticated uploads and public reads

# CONSTRAINTS
- Use existing env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
- Match existing handler patterns (see src/handlers/workflow.ts)
- Add to CORS allowed headers if needed

# VERIFICATION
npm run build && npx wrangler deploy
"
```

---

## Prompt 2: WarrantyOS (Bug Reporter Fix)

**Directory**: `/Users/rashid/Desktop/Workspaces/projects/inline-substitute/vin-to-value-main`

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 40 \
  "
# MISSION
Fix bug reporter to send diagnostic_data inside meta (not as separate field)
and upload screenshots before capture.

# PROBLEM
Currently in src/features/bug-reporter/services/bugReporterService.ts:
- diagnostic_data is sent as top-level field but Mentu API ignores it
- Only stores: body, kind, meta
- Screenshots are flagged has_screenshot:true but not actually sent

# DELIVERABLES
1. Add uploadScreenshot method to BugReporterService:
   - POST to \${MENTU_API_URL}/bug-screenshot
   - Send { bug_id, screenshot } (base64)
   - Return URL or null on failure

2. Modify submitReport:
   - Generate temp bug_id for screenshot filename
   - Call uploadScreenshot if submission.screenshot exists
   - Store URL in meta.screenshot_url

3. Restructure mentuOperation.meta to INCLUDE diagnostic_data:
   BEFORE: { ...flatMeta }, diagnostic_data: { console_logs, behavior_trace, selected_element }
   AFTER:  { ...flatMeta, diagnostic_data: { console_logs, behavior_trace, selected_element }, screenshot_url }

4. Remove the top-level diagnostic_data field from mentuOperation

# KEY CHANGES
- Line 109-165: mentuOperation structure
- Move lines 160-164 (diagnostic_data) INSIDE meta object
- Add screenshot upload before the fetch call

# CONSTRAINTS
- Keep existing meta fields (source, environment, etc.)
- Don't break existing functionality
- Handle screenshot upload failures gracefully (continue without screenshot)

# VERIFICATION
npm run build
"
```

---

## Prompt 3: mentu-web (Display Updates)

**Directory**: `/Users/rashid/Desktop/Workspaces/mentu-web`

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 50 \
  "
# MISSION
Update bug reports display to:
1. Extract diagnostic_data from meta.diagnostic_data (new location)
2. Display screenshots from meta.screenshot_url
3. Fix RightPanelProvider error if present

# CONTEXT
WarrantyOS will now send diagnostic_data INSIDE meta instead of as separate field.
Screenshots will be URLs to Supabase Storage.

# DELIVERABLES

## 1. Create src/components/bug-report/screenshot-viewer.tsx
- Accept url prop
- Show thumbnail with click-to-expand modal
- Handle loading and error states
- Use Next.js Image component with unoptimized

## 2. Update src/hooks/useBugReports.ts
Extract diagnostic_data from meta.diagnostic_data:

BEFORE (line 150):
  const diagnosticData = (payload as unknown as Record<string, unknown>).diagnostic_data

AFTER:
  const meta = payload.meta as Record<string, unknown> | undefined;
  const diagnosticData = meta?.diagnostic_data as { console_logs?, behavior_trace?, selected_element? } | undefined;

Also extract screenshot_url:
  screenshot_url: meta?.screenshot_url as string | undefined,

Add to BugReport interface:
  screenshot_url?: string;

## 3. Update src/components/bug-report/bug-report-detail.tsx
- Import ScreenshotViewer
- Add Screenshot section after Description (before Environment)
- Show if bug.screenshot_url exists

## 4. Check RightPanelProvider
- Verify all routes using useRightPanel go through [plane]/layout.tsx
- If error persists, add defensive check in affected components

# CONSTRAINTS
- Don't break existing bug reports without screenshots
- Keep console log color coding
- Maintain responsive design

# VERIFICATION
npm run build
"
```

---

## Execution Order

1. **mentu-proxy first** (creates the screenshot upload endpoint)
2. **WarrantyOS second** (sends data correctly + uploads screenshots)
3. **mentu-web third** (displays the data)

---

## Post-Implementation

After all three agents complete:

1. Deploy mentu-proxy: `cd mentu-proxy && npx wrangler deploy`
2. Deploy WarrantyOS: (depends on their deployment process)
3. Deploy mentu-web: Automatic via Vercel on push

4. Create Supabase storage bucket:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-attachments', 'bug-attachments', true)
ON CONFLICT (id) DO NOTHING;
```

5. Test end-to-end:
   - Create bug report in WarrantyOS with screenshot
   - Verify screenshot uploads successfully
   - Verify bug appears in mentu.ai with screenshot displayed

---

*These prompts enable parallel execution across three codebases.*
