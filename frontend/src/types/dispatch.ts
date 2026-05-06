// TODO: replace with fetch('/api/v1/dispatch')
export type DispatchState = 'received' | 'en_route' | 'on_scene' | 'closed';
export type DispatchReason = 'intrusion' | 'fire' | 'visitor' | 'check' | 'panic' | 'maintenance';

export interface DispatchEvent {
  state: DispatchState;
  at: string;
  by?: string;
  note?: string;
}

export interface DispatchTicket {
  id: string;
  alertId?: string;
  siteId: string;
  siteName: string;
  reason: DispatchReason;
  state: DispatchState;
  responder: string;
  responderPhone: string;
  receivedAt: string;
  etaMin: number;
  arrivedAt?: string;
  closedAt?: string;
  notes: string;
  events: DispatchEvent[];
}
