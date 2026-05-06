import { useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Drawer } from './Drawer';
import { Badge, type BadgeTone } from './Badge';
import { Button } from './Button';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/time';
import type { AppEvent, EventLevel, EventType } from '@/types';
import form from './Form.module.css';

const LEVEL_TONE: Record<EventLevel, BadgeTone> = {
  info: 'info',
  warning: 'warn',
  danger: 'danger',
  success: 'success',
};

const LEVEL_LABEL: Record<EventLevel, string> = {
  info: '정보',
  warning: '주의',
  danger: '긴급',
  success: '정상',
};

const TYPE_LABEL: Record<EventType, string> = {
  motion: '모션 감지',
  intrusion: '침입 감지',
  line_crossing: '라인 크로싱',
  face_match: '얼굴 매칭',
  lpr: '번호판 인식',
  offline: '오프라인',
  online: '온라인',
  storage_warn: '저장소 경고',
};

interface Props {
  event: AppEvent | null;
  onClose: () => void;
}

export function EventDrawer({ event, onClose }: Props) {
  const cameras = useDataStore((s) => s.cameras);
  const sites = useDataStore((s) => s.sites);
  const patchEvent = useDataStore((s) => s.patchEvent);
  const toast = useToast();

  const camera = useMemo(
    () => (event ? cameras.find((c) => c.id === event.cameraId) ?? null : null),
    [event, cameras],
  );
  const site = useMemo(
    () => (event ? sites.find((s) => s.id === event.siteId) ?? null : null),
    [event, sites],
  );

  const handleAck = () => {
    if (!event) return;
    patchEvent(event.id, { acknowledged: true });
    toast.success('이벤트 확인', `${event.message}`);
    onClose();
  };

  const rawMeta = event
    ? JSON.stringify(
        {
          id: event.id,
          type: event.type,
          level: event.level,
          cameraId: event.cameraId,
          siteId: event.siteId,
          occurredAt: event.occurredAt,
          acknowledged: event.acknowledged,
          snapshotUrl: event.snapshotUrl ?? null,
        },
        null,
        2,
      )
    : '';

  return (
    <Drawer
      open={!!event}
      onClose={onClose}
      title="이벤트 상세"
      subtitle={event?.message}
      footer={
        event && !event.acknowledged ? (
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>
              닫기
            </Button>
            <Button variant="primary" size="sm" onClick={handleAck}>
              확인 처리
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={onClose}>
            닫기
          </Button>
        )
      }
    >
      {event && (
        <>
          <div className={form.sectionCaption}>개요</div>
          <div className={form.kv}>
            <span className={form.kvLabel}>종류</span>
            <span className={form.kvVal}>{TYPE_LABEL[event.type]}</span>
          </div>
          <div className={form.kv}>
            <span className={form.kvLabel}>심각도</span>
            <Badge tone={LEVEL_TONE[event.level]} dot>
              {LEVEL_LABEL[event.level]}
            </Badge>
          </div>
          <div className={form.kv}>
            <span className={form.kvLabel}>카메라</span>
            <span className={form.kvVal}>{camera?.name ?? '—'}</span>
          </div>
          <div className={form.kv}>
            <span className={form.kvLabel}>사이트</span>
            <span className={form.kvVal}>{site?.name ?? '—'}</span>
          </div>
          <div className={form.kv}>
            <span className={form.kvLabel}>발생 시각</span>
            <span className={form.kvVal} style={{ fontFamily: 'var(--font-mono)' }}>
              {formatDateTime(event.occurredAt)}
            </span>
          </div>
          <div className={form.kv}>
            <span className={form.kvLabel}>처리 상태</span>
            <Badge tone={event.acknowledged ? 'success' : 'warn'} dot>
              {event.acknowledged ? '확인 완료' : '미확인'}
            </Badge>
          </div>

          <div className={form.sectionCaption}>원시 메타</div>
          <pre className={form.jsonBlock}>{rawMeta}</pre>
        </>
      )}
    </Drawer>
  );
}
