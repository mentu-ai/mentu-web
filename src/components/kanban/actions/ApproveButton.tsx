'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Commitment } from '@/lib/mentu/types';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ApproveButtonProps {
  commitment: Commitment;
  workspaceId: string;
  onApproved?: () => void;
}

export function ApproveButton({
  commitment,
  onApproved,
}: ApproveButtonProps) {
  const [isApproving, setIsApproving] = useState(false);

  // Only show for commitments in review
  if (commitment.state !== 'in_review') {
    return null;
  }

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch('/api/ops/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commitment_id: commitment.id,
          comment: 'Approved via Kanban dashboard',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve');
      }

      // Success - trigger callback
      onApproved?.();
    } catch (error) {
      console.error('Approve error:', error);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleApprove}
      disabled={isApproving}
      className="gap-1 bg-green-600 hover:bg-green-700"
    >
      {isApproving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Approving...
        </>
      ) : (
        <>
          <CheckCircle className="h-3 w-3" />
          Approve
        </>
      )}
    </Button>
  );
}
