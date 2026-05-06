// TODO: replace with fetch('/api/v1/cameras/live')
import { useEffect, useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import styles from './Monitoring.module.css';

const LAYOUTS = [2, 3, 4] as const;
const TIMELINE_HOURS = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];

type Zone = '전체' | '출입구' | '매장' | '주차장' | '사무실';
const ZONES: Zone[] = ['전체', '출입구', '매장', '주차장', '사무실'];

function cameraZone(name: string): Zone {
  if (name.includes('출입') || name.includes('정문') || name.includes('옥외') || name.includes('적재')) return '출입구';
  if (name.includes('주차')) return '주차장';
  if (name.includes('매장') || name.includes('로비') || name.includes('카페')) return '매장';
  if (name.includes('서버') || name.includes('R&D') || name.includes('사무')) return '사무실';
  return '전체';
}

export default function Monitoring() {
  const sites = useDataStore((s) => s.sites);
  const cameras = useDataStore((s) => s.cameras);
  const patchCamera = useDataStore((s) => s.patchCamera);
  const toast = useToast();
  const [siteId, setSiteId] = useState<string>(sites[0]?.id ?? '');
  const [layout, setLayout] = useState<2 | 3 | 4>(3);
  const [zone, setZone] = useState<Zone>('전체');
  const [playing, setPlaying] = useState(false);
  const [maximizedCamId, setMaximizedCamId] = useState<string | null>(null);
  const [maximizedVideoIdx, setMaximizedVideoIdx] = useState(1);

  useEffect(() => {
    if (!maximizedCamId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaximizedCamId(null);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [maximizedCamId]);

  function pad(n: number) {
    return n.toString().padStart(2, '0');
  }
  function timestampStr() {
    const d = new Date();
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  const handleSnapshot = (camName: string) => {
    toast.success('스냅샷 저장', `${camName}_${timestampStr()}.jpg`);
  };

  const handleToggleRecording = (camId: string, camName: string, nowRec: boolean) => {
    patchCamera(camId, { recording: !nowRec });
    if (nowRec) {
      toast.info('녹화 중지', `${camName} 카메라의 녹화를 중지했습니다.`);
    } else {
      toast.success('녹화 시작', `${camName} 카메라의 녹화를 시작합니다.`);
    }
  };

  const siteCams = useMemo(
    () => cameras.filter((c) => c.siteId === siteId).filter((c) => zone === '전체' || cameraZone(c.name) === zone),
    [cameras, siteId, zone],
  );
  const [selectedId, setSelectedId] = useState<string>(siteCams[0]?.id ?? cameras[0]?.id ?? '');

  const slotCount = layout * layout;
  const [slotMap, setSlotMap] = useState<(string | null)[]>([]);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  // auto-fill slots from siteCams when site / layout / zone changes
  useEffect(() => {
    const arr: (string | null)[] = siteCams.slice(0, slotCount).map((c) => c.id);
    while (arr.length < slotCount) arr.push(null);
    setSlotMap(arr);
  }, [siteId, slotCount, zone, siteCams.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const slots = useMemo(
    () => slotMap.map((id) => (id ? cameras.find((c) => c.id === id) ?? null : null)),
    [slotMap, cameras],
  );

  const handleDragStart = (e: React.DragEvent, camId: string, fromSlot?: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ camId, fromSlot: fromSlot ?? null }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slotIdx) setDragOverSlot(slotIdx);
  };
  const handleDragLeave = () => setDragOverSlot(null);
  const handleDrop = (e: React.DragEvent, toSlot: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      const { camId, fromSlot } = JSON.parse(raw) as { camId: string; fromSlot: number | null };
      setSlotMap((prev) => {
        const next = [...prev];
        if (fromSlot != null && fromSlot !== toSlot) {
          const target = next[toSlot] ?? null;
          next[toSlot] = camId;
          next[fromSlot] = target;
        } else if (fromSlot == null) {
          next[toSlot] = camId;
        }
        return next;
      });
    } catch {
      // ignore bad payload
    }
  };
  const handleRemoveSlot = (slotIdx: number) => {
    setSlotMap((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  const selected = cameras.find((c) => c.id === selectedId) ?? null;
  const onlineCount = siteCams.filter((c) => c.status !== 'offline').length;

  const gridCls = [styles.grid, layout === 2 ? styles.grid2 : layout === 3 ? styles.grid3 : styles.grid4]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolLeft}>
          <span className={styles.toolTitle}>실시간 모니터링</span>
          <Badge tone="success" dot>
            {onlineCount}/{siteCams.length} 온라인
          </Badge>
        </div>
        <div className={styles.segment}>
          {LAYOUTS.map((n) => (
            <button
              key={n}
              className={[styles.segmentBtn, layout === n ? styles.segmentActive : ''].join(' ')}
              onClick={() => setLayout(n)}
              type="button"
            >
              {n}×{n}
            </button>
          ))}
        </div>
      </div>

      <aside className={styles.sideCard}>
        <div className={styles.sideTitle}>사이트 트리</div>
        <div className={styles.tree}>
          {sites.map((s) => {
            const siteCamsList = cameras.filter((c) => c.siteId === s.id);
            const count = siteCamsList.length;
            const online = siteCamsList.filter((c) => c.status !== 'offline').length;
            const expanded = siteId === s.id;
            return (
              <div key={s.id} className={styles.treeGroup}>
                <div
                  className={[styles.treeRow, expanded ? styles.activeRow : ''].join(' ')}
                  onClick={() => {
                    setSiteId(s.id);
                    setZone('전체');
                    const first = cameras.find((c) => c.siteId === s.id);
                    if (first) setSelectedId(first.id);
                  }}
                >
                  <span className={styles.treeCaret} aria-hidden>
                    {expanded ? '▾' : '▸'}
                  </span>
                  <span className={styles.treeSiteName}>{s.name}</span>
                  <small>
                    {online}/{count}
                  </small>
                </div>
                {expanded && (
                  <div className={styles.treeCamList}>
                    {siteCamsList.map((c) => {
                      const placed = slotMap.includes(c.id);
                      const statusTone =
                        c.status === 'offline' ? 'danger' : c.status === 'recording' ? 'warn' : 'success';
                      return (
                        <div
                          key={c.id}
                          className={[
                            styles.treeCamRow,
                            placed ? styles.treeCamPlaced : '',
                            c.id === selectedId ? styles.treeCamSelected : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          draggable={c.status !== 'offline'}
                          onDragStart={(e) => handleDragStart(e, c.id)}
                          onClick={() => setSelectedId(c.id)}
                          title={c.status === 'offline' ? '오프라인 — 드래그 불가' : '타일로 드래그하여 배치'}
                        >
                          <span className={styles.treeCamHandle} aria-hidden>⋮⋮</span>
                          <span className={styles.treeCamName}>{c.name}</span>
                          <Badge tone={statusTone} dot>
                            {c.status === 'offline' ? 'off' : c.resolution}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.sideTitle}>구역 필터</div>
        <div className={styles.zoneChips}>
          {ZONES.map((z) => (
            <button
              key={z}
              className={[styles.zoneChip, zone === z ? styles.zoneChipActive : ''].join(' ')}
              onClick={() => setZone(z)}
              type="button"
            >
              {z}
            </button>
          ))}
        </div>
      </aside>

      <div className={gridCls}>
        {slots.map((cam, i) => {
          const dropHighlight = dragOverSlot === i ? styles.camDropTarget : '';
          if (!cam) {
            return (
              <div
                key={`empty-${i}`}
                className={[styles.cam, styles.camEmpty, dropHighlight].filter(Boolean).join(' ')}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, i)}
              >
                <span className={styles.camEmptyHint}>드래그하여 카메라 배치</span>
              </div>
            );
          }
          const offline = cam.status === 'offline';
          const recording = cam.recording;
          const selectedCls = cam.id === selectedId ? styles.camSelected : '';
          const videoIdx = (i % 6) + 1;
          const videoSrc = `/mock-cctv/cam_0${videoIdx}.mp4`;
          return (
            <div
              key={`${cam.id}-${i}`}
              className={[styles.cam, offline ? styles.camOffline : '', selectedCls, dropHighlight]
                .filter(Boolean)
                .join(' ')}
              draggable={!offline}
              onDragStart={(e) => handleDragStart(e, cam.id, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, i)}
              onClick={() => setSelectedId(cam.id)}
              onDoubleClick={() => {
                setMaximizedCamId(cam.id);
                setMaximizedVideoIdx(videoIdx);
              }}
            >
              {!offline && (
                <video
                  className={styles.camVideo}
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                />
              )}
              {!offline && <span className={styles.onlineDot} />}
              {recording && !offline && (
                <span className={styles.recBadge}>
                  <span /> REC
                </span>
              )}
              {!offline && <span className={styles.simLabel}>SIM LIVE</span>}
              <span className={styles.camLabel}>
                {cam.name.split(' ')[0]} · {cam.resolution}
              </span>
              <button
                type="button"
                className={styles.slotRemove}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSlot(i);
                }}
                title="슬롯 비우기"
                aria-label="슬롯 비우기"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <aside className={styles.sideCard}>
        <div className={styles.sideTitle}>선택 카메라</div>
        {selected ? (
          <div className={styles.selCard}>
            <strong style={{ color: 'var(--color-text)' }}>{selected.name}</strong>
            <div className={styles.selRow}>
              <span>상태</span>
              <Badge
                tone={
                  selected.status === 'offline'
                    ? 'danger'
                    : selected.status === 'recording'
                      ? 'warn'
                      : 'success'
                }
                dot
              >
                {selected.status}
              </Badge>
            </div>
            <div className={styles.selRow}>
              <span>IP</span>
              <strong>{selected.ip}</strong>
            </div>
            <div className={styles.selRow}>
              <span>코덱</span>
              <strong>{selected.codec}</strong>
            </div>
            <div className={styles.selRow}>
              <span>해상도</span>
              <strong>{selected.resolution}</strong>
            </div>
            <div className={styles.selRow}>
              <span>FPS</span>
              <strong>{selected.fps}</strong>
            </div>
            <div className={styles.selRow}>
              <span>저장소</span>
              <strong>{selected.storageGb}GB</strong>
            </div>
            <div className={styles.snapshotActs}>
              <Button
                variant="secondary"
                size="sm"
                block
                onClick={() => handleSnapshot(selected.name)}
              >
                스냅샷 저장
              </Button>
              <Button
                variant="primary"
                size="sm"
                block
                onClick={() =>
                  handleToggleRecording(selected.id, selected.name, selected.recording)
                }
              >
                {selected.recording ? '녹화 중지' : '녹화 시작'}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)' }}>카메라를 선택하세요.</div>
        )}
      </aside>

      <div className={styles.timeline}>
        <div className={styles.timelineCtrl}>
          <div className={styles.timelineBtns}>
            <button className={styles.playBtn} type="button" title="처음으로">
              ⏮
            </button>
            <button
              className={[styles.playBtn, playing ? styles.playBtnActive : ''].join(' ')}
              onClick={() => setPlaying((p) => !p)}
              type="button"
              title="재생/일시정지"
            >
              {playing ? '⏸ 일시정지' : '▶ 재생'}
            </button>
            <button className={styles.playBtn} type="button" title="끝으로">
              ⏭
            </button>
            <button className={styles.playBtn} type="button" title="실시간">
              ● LIVE
            </button>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            2026-04-23 · 07:42:15
          </span>
        </div>
        <div className={styles.timelineBar}>
          <div className={styles.timelineProg} />
          <span className={styles.timelineMark} style={{ left: '22%' }} />
          <span className={styles.timelineMark} style={{ left: '58%' }} />
          <span className={styles.timelineMark} style={{ left: '74%' }} />
        </div>
        <div className={styles.timelineHours}>
          {TIMELINE_HOURS.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
      </div>

      {maximizedCamId && (() => {
        const c = cameras.find((x) => x.id === maximizedCamId);
        if (!c) return null;
        const site = sites.find((s) => s.id === c.siteId);
        const offline = c.status === 'offline';
        const src = `/mock-cctv/cam_0${maximizedVideoIdx}.mp4`;
        return (
          <div
            className={styles.maxOverlay}
            onClick={() => setMaximizedCamId(null)}
            onDoubleClick={() => setMaximizedCamId(null)}
            role="dialog"
            aria-label="카메라 최대화"
          >
            <div
              className={styles.maxStage}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={() => setMaximizedCamId(null)}
            >
              {!offline && (
                <video
                  className={styles.maxVideo}
                  src={src}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              )}
              {offline && <div className={styles.maxOffline}>⊘ offline</div>}
              <div className={styles.maxTopBar}>
                <div className={styles.maxTitleBox}>
                  <span className={styles.maxTitle}>{c.name}</span>
                  <span className={styles.maxSub}>
                    {site?.name ?? '—'} · {c.resolution} @ {c.fps}fps
                  </span>
                </div>
                <div className={styles.maxMeta}>
                  {c.recording && !offline && (
                    <span className={styles.maxRec}>
                      <span /> REC
                    </span>
                  )}
                  <Badge
                    tone={offline ? 'danger' : c.status === 'recording' ? 'warn' : 'success'}
                    dot
                  >
                    {c.status}
                  </Badge>
                  <button
                    type="button"
                    className={styles.maxClose}
                    onClick={() => setMaximizedCamId(null)}
                    aria-label="최대화 해제 (ESC)"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className={styles.maxHint}>더블클릭 또는 ESC · 바깥 영역 클릭 시 닫힘</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
