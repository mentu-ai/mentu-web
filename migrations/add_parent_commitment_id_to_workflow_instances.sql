-- Add parent_commitment_id to workflow_instances
-- Links a workflow instance to the commitment that triggered/scheduled it
-- NOTE: commitments.id is TEXT (e.g. "cmt_abc123"), not UUID
ALTER TABLE workflow_instances
  ADD COLUMN IF NOT EXISTS parent_commitment_id TEXT REFERENCES commitments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_instances_parent_commitment
  ON workflow_instances(parent_commitment_id)
  WHERE parent_commitment_id IS NOT NULL;
