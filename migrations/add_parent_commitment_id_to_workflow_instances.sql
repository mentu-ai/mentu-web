-- Add parent_commitment_id to workflow_instances
-- Links a workflow instance to the commitment that triggered/scheduled it
ALTER TABLE workflow_instances
  ADD COLUMN IF NOT EXISTS parent_commitment_id UUID REFERENCES commitments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_instances_parent_commitment
  ON workflow_instances(parent_commitment_id)
  WHERE parent_commitment_id IS NOT NULL;
