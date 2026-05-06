// TODO: replace with fetch('/api/v1/cases')
export type CaseStatus = 'open' | 'in_progress' | 'review' | 'closed';
export type CasePriority = 'low' | 'mid' | 'high';

export interface CaseAttachment {
  id: string;
  kind: 'clip' | 'snapshot' | 'document';
  cameraName: string;
  siteName: string;
  capturedAt: string;
  durationSec?: number;
  thumbSeed: string;
  note?: string;
}

export interface CaseComment {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface SecurityCase {
  id: string;
  code: string; // C-2026-0421-001
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  owner: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  description: string;
  attachments: CaseAttachment[];
  comments: CaseComment[];
  shareLink?: { url: string; expiresAt: string };
}
