// TODO: replace with fetch('/api/v1/cameras/{id}') + PATCH
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BtnGroup } from '@/components/ui/BtnGroup';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import type {
  CameraAlgorithm,
  AlgorithmSensitivity,
  ZonePoint,
  ZonePolygon,
} from '@/types';
import { MAX_AI_ALGOS, SENSITIVITY_OPTIONS } from '@/types/algorithm';
import page from './Page.module.css';
import algoStyles from './CameraSettings.module.css';

type SettingsTab = 'algorithm' | 'system' | 'osd' | 'video' | 'record' | 'network';

// ROI accent palette — 해시 기반 색 순환. fill rgba 를 0.14 → 0.32~0.35 로 상향.
const ROI_PALETTE = [
  { stroke: 'var(--color-accent)', fill: 'rgba(21, 83, 198, 0.34)' },
  { stroke: 'var(--color-warn)', fill: 'rgba(217, 119, 6, 0.34)' },
  { stroke: 'var(--color-success)', fill: 'rgba(22, 163, 74, 0.34)' },
  { stroke: 'var(--color-info)', fill: 'rgba(21, 83, 198, 0.32)' },
  { stroke: 'var(--color-danger)', fill: 'rgba(220, 38, 38, 0.32)' },
];

/** Close 자동 인식 반경 (정규화 좌표 — 2%) */
const CLOSE_RADIUS = 0.02;

function hashIdx(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % ROI_PALETTE.length;
}

function AlgoIcon({ algoKey }: { algoKey: string }) {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (algoKey) {
    case 'motion':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
        </svg>
      );
    case 'privacy':
      return (
        <svg {...commonProps}>
          <rect x="4" y="7" width="16" height="12" rx="2" />
          <path d="M8 7V5a4 4 0 018 0v2" />
        </svg>
      );
    case 'intrusion':
      return (
        <svg {...commonProps}>
          <path d="M3 21l4-10 5 3 5-8 4 10" />
          <circle cx="17" cy="5" r="1.5" />
        </svg>
      );
    case 'loitering':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 1.5" />
        </svg>
      );
    case 'virtual_fence':
      return (
        <svg {...commonProps}>
          <path d="M3 18L21 6" strokeDasharray="3 2" />
          <circle cx="5" cy="17" r="1.6" />
          <circle cx="19" cy="7" r="1.6" />
        </svg>
      );
    case 'fire':
      return (
        <svg {...commonProps}>
          <path d="M12 3c1 4 4 5 4 9a4 4 0 11-8 0c0-2 1-3 2-4 0 2 1 2 2 1 0-2-1-4 0-6z" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: 'algorithm', label: '알고리즘' },
  { key: 'system', label: '시스템' },
  { key: 'osd', label: 'OSD' },
  { key: 'video', label: '영상' },
  { key: 'record', label: '녹화' },
  { key: 'network', label: '네트워크' },
];

function Kv({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={page.kvRow}>
      <span className={page.kvLabel}>{label}</span>
      <span className={page.kvVal}>{value}</span>
    </div>
  );
}

function Slider({ label, value }: { label: string; value: number }) {
  return (
    <div className={page.progressRow}>
      <div className={page.progressTop}>
        <span className={page.kvLabel}>{label}</span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{value}</span>
      </div>
      <div className={page.progressTrack}>
        <div className={page.progressFill} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** Live preview card with ROI polygon overlay + click-to-draw. */
interface LivePreviewProps {
  camName: string;
  camStatus: string;
  videoIdx: number; // 1..6
  offline: boolean;
  algos: CameraAlgorithm[];
  activeAlgoId: string | null;
  drawMode: boolean;
  onDrawComplete: (polygon: Omit<ZonePolygon, 'id'>) => void;
  onPolygonRemove: (algoId: string, polygonId: string) => void;
  onPolygonUpdate: (algoId: string, polygonId: string, points: ZonePoint[]) => void;
  onCancelDraw: () => void;
}

interface DragPoly {
  algoId: string;
  polyId: string;
  origPoints: ZonePoint[];
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  moved: boolean;
}

function polygonBounds(points: ZonePoint[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function LivePreview({
  camName,
  camStatus,
  videoIdx,
  offline,
  algos,
  activeAlgoId,
  drawMode,
  onDrawComplete,
  onPolygonRemove,
  onPolygonUpdate,
  onCancelDraw,
}: LivePreviewProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [vertices, setVertices] = useState<ZonePoint[]>([]);
  const [cursor, setCursor] = useState<ZonePoint | null>(null);
  const [selectedPolygon, setSelectedPolygon] = useState<string | null>(null);
  const [dragPoly, setDragPoly] = useState<DragPoly | null>(null);

  const resetDraw = useCallback(() => {
    setVertices([]);
    setCursor(null);
  }, []);

  const completeDraw = useCallback(
    (pts: ZonePoint[]) => {
      if (pts.length < 3) return;
      onDrawComplete({ points: pts });
      setVertices([]);
      setCursor(null);
    },
    [onDrawComplete],
  );

  // Reset vertex state when exiting drawMode
  useEffect(() => {
    if (!drawMode) {
      setVertices([]);
      setCursor(null);
    }
  }, [drawMode]);

  // Keyboard handlers — ESC / Enter / Backspace
  useEffect(() => {
    if (!drawMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resetDraw();
        onCancelDraw();
      } else if (e.key === 'Enter') {
        if (vertices.length >= 3) {
          e.preventDefault();
          completeDraw(vertices);
        }
      } else if (e.key === 'Backspace') {
        if (vertices.length > 0) {
          e.preventDefault();
          setVertices((v) => v.slice(0, -1));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawMode, vertices, resetDraw, onCancelDraw, completeDraw]);

  const getXY = useCallback((e: React.MouseEvent): ZonePoint => {
    const el = boxRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    return { x, y };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (!drawMode || offline) return;
    // double click handled separately (React fires click then dblclick)
    if (e.detail >= 2) return;
    e.preventDefault();
    const pt = getXY(e);
    // auto-close if clicking within CLOSE_RADIUS of the first vertex (and already ≥3 vertices)
    if (vertices.length >= 3) {
      const first = vertices[0];
      const dx = pt.x - first.x;
      const dy = pt.y - first.y;
      if (Math.hypot(dx, dy) <= CLOSE_RADIUS) {
        completeDraw(vertices);
        return;
      }
    }
    setVertices((v) => [...v, pt]);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!drawMode || offline) return;
    e.preventDefault();
    if (vertices.length >= 3) {
      completeDraw(vertices);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragPoly) {
      const { x, y } = getXY(e);
      let dx = x - dragPoly.startX;
      let dy = y - dragPoly.startY;
      const b = polygonBounds(dragPoly.origPoints);
      dx = Math.max(-b.minX, Math.min(1 - b.maxX, dx));
      dy = Math.max(-b.minY, Math.min(1 - b.maxY, dy));
      const moved = dragPoly.moved || Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005;
      setDragPoly({ ...dragPoly, dx, dy, moved });
      return;
    }
    if (!drawMode) return;
    setCursor(getXY(e));
  };

  const handleMouseUp = () => {
    if (!dragPoly) return;
    if (dragPoly.moved) {
      const nextPoints = dragPoly.origPoints.map((p) => ({
        x: p.x + dragPoly.dx,
        y: p.y + dragPoly.dy,
      }));
      onPolygonUpdate(dragPoly.algoId, dragPoly.polyId, nextPoints);
    }
    setDragPoly(null);
  };

  const handlePolyMouseDown = (
    e: React.MouseEvent,
    algoId: string,
    poly: ZonePolygon,
  ) => {
    if (drawMode || algoId !== activeAlgoId) return;
    e.stopPropagation();
    e.preventDefault();
    const { x, y } = getXY(e);
    setDragPoly({
      algoId,
      polyId: poly.id,
      origPoints: poly.points,
      startX: x,
      startY: y,
      dx: 0,
      dy: 0,
      moved: false,
    });
  };

  const handleMouseLeave = () => {
    if (drawMode) setCursor(null);
    if (dragPoly) {
      // treat leave as cancel
      setDragPoly(null);
    }
  };

  const cursorStyle: React.CSSProperties = drawMode && !offline
    ? { cursor: 'crosshair' }
    : dragPoly
      ? { cursor: 'grabbing' }
      : {};

  // Guide line last-vertex → cursor
  const lastVertex = vertices.length > 0 ? vertices[vertices.length - 1] : null;

  return (
    <Card title={camName} actions={<Badge tone={camStatus === 'offline' ? 'danger' : 'success'} dot>{camStatus}</Badge>}>
      <div
        ref={boxRef}
        className={page.preview}
        style={cursorStyle}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {!offline && (
          <video
            className={page.previewVideo}
            src={`/mock-cctv/cam_0${videoIdx}.mp4`}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        )}
        {offline && <span style={{ position: 'relative', zIndex: 2 }}>OFFLINE</span>}

        {/* SVG overlay for ROI polygons */}
        <svg
          className={page.previewSvg}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden={!drawMode}
        >
          {/* Spotlight: darken everything except polygon areas */}
          <defs>
            <mask id="roi-spotlight">
              <rect x="0" y="0" width="100" height="100" fill="white" />
              {algos.flatMap((a) =>
                (a.polygons ?? []).map((poly) => {
                  const shift =
                    dragPoly && dragPoly.polyId === poly.id
                      ? { dx: dragPoly.dx, dy: dragPoly.dy }
                      : { dx: 0, dy: 0 };
                  const pts = poly.points
                    .map((p) => `${(p.x + shift.dx) * 100},${(p.y + shift.dy) * 100}`)
                    .join(' ');
                  return <polygon key={`m-${poly.id}`} points={pts} fill="black" />;
                }),
              )}
              {/* in-progress drawing polygon also gets mask cut */}
              {drawMode && vertices.length >= 3 && (
                <polygon
                  points={vertices.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="black"
            opacity="0.52"
            mask="url(#roi-spotlight)"
            style={{ pointerEvents: 'none' }}
          />

          {algos.flatMap((a) => {
            const isActive = a.id === activeAlgoId;
            const pal = ROI_PALETTE[hashIdx(a.id)];
            const op = isActive ? 1 : 0.55;
            return (a.polygons ?? []).map((poly, i) => {
              const sel = selectedPolygon === poly.id;
              const isDragging = dragPoly?.polyId === poly.id;
              const shift = isDragging ? { dx: dragPoly!.dx, dy: dragPoly!.dy } : { dx: 0, dy: 0 };
              const pointsAttr = poly.points
                .map((p) => `${(p.x + shift.dx) * 100},${(p.y + shift.dy) * 100}`)
                .join(' ');
              const first = poly.points[0];
              const firstShifted = first
                ? { x: first.x + shift.dx, y: first.y + shift.dy }
                : null;
              return (
                <g key={poly.id} opacity={op} style={{ pointerEvents: drawMode ? 'none' : 'auto' }}>
                  <polygon
                    points={pointsAttr}
                    fill={pal.fill}
                    stroke={pal.stroke}
                    strokeWidth={sel || isDragging ? 4 : 3.2}
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    style={{
                      cursor: isActive && !drawMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
                      filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))',
                    }}
                    onMouseDown={(ev) => handlePolyMouseDown(ev, a.id, poly)}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (!isActive || drawMode) return;
                      if (dragPoly?.moved) return; // just finished dragging
                      setSelectedPolygon(sel ? null : poly.id);
                    }}
                  />
                  {/* vertex markers (visible on active polygon) */}
                  {isActive &&
                    poly.points.map((p, vi) => (
                      <circle
                        key={`v-${vi}`}
                        cx={(p.x + shift.dx) * 100}
                        cy={(p.y + shift.dy) * 100}
                        r={1.2}
                        fill="var(--color-base-white)"
                        stroke={pal.stroke}
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                        style={{
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                          pointerEvents: 'none',
                        }}
                      />
                    ))}
                  {firstShifted && (
                    <text
                      x={firstShifted.x * 100 + 1.4}
                      y={firstShifted.y * 100 - 1.2}
                      fontSize={3.2}
                      fontWeight="700"
                      fill={pal.stroke}
                      stroke="rgba(0,0,0,0.65)"
                      strokeWidth={0.6}
                      paintOrder="stroke fill"
                      fontFamily="var(--font-mono)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {a.label.slice(0, 6)}·{i + 1}
                    </text>
                  )}
                </g>
              );
            });
          })}

          {/* In-progress polygon preview */}
          {drawMode && vertices.length > 0 && (
            <g style={{ pointerEvents: 'none' }}>
              {/* closed edges between vertices */}
              {vertices.length >= 2 && (
                <polyline
                  points={vertices.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.95}
                />
              )}
              {/* guide line from last vertex to cursor */}
              {lastVertex && cursor && (
                <line
                  x1={lastVertex.x * 100}
                  y1={lastVertex.y * 100}
                  x2={cursor.x * 100}
                  y2={cursor.y * 100}
                  stroke="var(--color-accent)"
                  strokeWidth={1.5}
                  strokeDasharray="1.2 0.8"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.9}
                />
              )}
              {/* vertex dots */}
              {vertices.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x * 100}
                  cy={p.y * 100}
                  r={0.9}
                  fill="var(--color-base-white)"
                  stroke="var(--color-accent)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Overlay × buttons for selected polygon (HTML — positioned absolutely at bbox top-right) */}
        {!drawMode &&
          algos.flatMap((a) => {
            if (a.id !== activeAlgoId) return [];
            return (a.polygons ?? [])
              .filter((poly) => poly.id === selectedPolygon)
              .map((poly) => {
                const b = polygonBounds(poly.points);
                return (
                  <button
                    key={`x-${poly.id}`}
                    type="button"
                    className={page.rectRemoveBtn}
                    style={{
                      left: `${b.maxX * 100}%`,
                      top: `${b.minY * 100}%`,
                    }}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onPolygonRemove(a.id, poly.id);
                      setSelectedPolygon(null);
                    }}
                    aria-label="영역 삭제"
                    title="영역 삭제"
                  >
                    ×
                  </button>
                );
              });
          })}

        {drawMode && (
          <div className={page.previewHint}>
            클릭으로 vertex 추가 · Enter/더블클릭/첫점 근접 클릭으로 완료 · Backspace 되돌리기 · ESC 취소
          </div>
        )}
      </div>
    </Card>
  );
}

export default function CameraSettings() {
  const cameras = useDataStore((s) => s.cameras);
  const algorithms = useDataStore((s) => s.algorithms);
  const patchAlgorithm = useDataStore((s) => s.patchAlgorithm);
  const addAlgorithmZone = useDataStore((s) => s.addAlgorithmZone);
  const removeAlgorithmZone = useDataStore((s) => s.removeAlgorithmZone);
  const addAlgorithmPolygon = useDataStore((s) => s.addAlgorithmPolygon);
  const removeAlgorithmPolygon = useDataStore((s) => s.removeAlgorithmPolygon);
  const toast = useToast();
  const tabCams = useMemo(() => cameras.slice(0, 5), [cameras]);
  const [activeId, setActiveId] = useState(tabCams[0]?.id ?? '');
  const [tab, setTab] = useState<SettingsTab>('algorithm');
  const cam = cameras.find((c) => c.id === activeId);

  const camAlgos = useMemo(
    () => algorithms.filter((a) => a.cameraId === activeId),
    [algorithms, activeId],
  );
  const basicAlgos = camAlgos.filter((a) => a.kind === 'basic');
  const aiAlgos = camAlgos.filter((a) => a.kind === 'ai');
  const aiEnabledCount = aiAlgos.filter((a) => a.enabled).length;
  const aiLimitReached = aiEnabledCount >= MAX_AI_ALGOS;

  // ROI drawing state — algorithm 탭에서만 유효
  const [activeAlgoId, setActiveAlgoId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);

  // Reset active algo when camera switches
  useEffect(() => {
    setActiveAlgoId(null);
    setDrawMode(false);
  }, [activeId]);

  // Auto-pick an active algorithm: prefer enabled, else first
  useEffect(() => {
    if (activeAlgoId && camAlgos.some((a) => a.id === activeAlgoId)) return;
    const first = camAlgos.find((a) => a.enabled) ?? camAlgos[0];
    if (first) setActiveAlgoId(first.id);
  }, [camAlgos, activeAlgoId]);

  // Mapping: activeId → videoIdx (index % 6 + 1)
  const videoIdx = useMemo(() => {
    const idx = cameras.findIndex((c) => c.id === activeId);
    return ((idx < 0 ? 0 : idx) % 6) + 1;
  }, [cameras, activeId]);

  if (!cam) {
    return <div>카메라가 없습니다.</div>;
  }

  const offline = cam.status === 'offline';

  const handleToggle = (a: CameraAlgorithm) => {
    if (!a.enabled && a.kind === 'ai' && aiLimitReached) {
      toast.warn('AI 알고리즘 제한', `최대 ${MAX_AI_ALGOS}개까지 동시 활성화할 수 있습니다`);
      return;
    }
    patchAlgorithm(a.cameraId, a.id, { enabled: !a.enabled });
    toast.info(
      a.enabled ? '알고리즘 비활성화' : '알고리즘 활성화',
      `${a.label} — ${cam.name.split(' ')[0]}`,
    );
  };

  const handleSensitivity = (a: CameraAlgorithm, s: AlgorithmSensitivity) => {
    patchAlgorithm(a.cameraId, a.id, { sensitivity: s });
  };

  const handleAddZone = (a: CameraAlgorithm) => {
    const label = addAlgorithmZone(a.cameraId, a.id);
    toast.success('영역 추가됨', `${a.label} · ${label}`);
  };

  const handleRemoveZone = (a: CameraAlgorithm, idx: number) => {
    const label = a.zones[idx];
    removeAlgorithmZone(a.cameraId, a.id, idx);
    toast.info('영역 삭제됨', `${a.label} · ${label}`);
  };

  const handleStartDraw = (a: CameraAlgorithm) => {
    setActiveAlgoId(a.id);
    setDrawMode(true);
  };

  const handleDrawComplete = (polygon: Omit<ZonePolygon, 'id'>) => {
    if (!activeAlgoId) return;
    const algo = camAlgos.find((x) => x.id === activeAlgoId);
    if (!algo) return;
    if (polygon.points.length < 3) return;
    addAlgorithmPolygon(algo.cameraId, algo.id, polygon);
    setDrawMode(false);
    toast.success('ROI 추가됨', `${algo.label} · ${polygon.points.length}개 vertex`);
  };

  const handlePolygonRemove = (algoId: string, polygonId: string) => {
    const algo = camAlgos.find((x) => x.id === algoId);
    if (!algo) return;
    removeAlgorithmPolygon(algo.cameraId, algo.id, polygonId);
    toast.info('ROI 삭제됨', `${algo.label}`);
  };

  const handlePolygonUpdate = (
    algoId: string,
    polygonId: string,
    points: ZonePoint[],
  ) => {
    const algo = camAlgos.find((x) => x.id === algoId);
    if (!algo) return;
    const nextPolygons = (algo.polygons ?? []).map((p) =>
      p.id === polygonId ? { ...p, points } : p,
    );
    patchAlgorithm(algo.cameraId, algo.id, { polygons: nextPolygons });
  };

  const handleRemovePolygonFromChip = (a: CameraAlgorithm, polygonId: string) => {
    removeAlgorithmPolygon(a.cameraId, a.id, polygonId);
  };

  return (
    <div className={page.page}>
      <div className={page.header}>
        <div className={page.actions}>
          <Button variant="secondary" size="sm">
            초기화
          </Button>
          <Button variant="primary" size="sm">
            저장
          </Button>
        </div>
      </div>

      <Tabs
        tabs={tabCams.map((c) => ({ key: c.id, label: c.name.split(' ')[0] }))}
        active={activeId}
        onChange={setActiveId}
      />

      {(() => {
        if (tab === 'algorithm') return null;
        const previewCard = (
          <LivePreview
            camName={cam.name}
            camStatus={cam.status}
            videoIdx={videoIdx}
            offline={offline}
            algos={[]}
            activeAlgoId={null}
            drawMode={false}
            onDrawComplete={() => {}}
            onPolygonRemove={() => {}}
            onPolygonUpdate={() => {}}
            onCancelDraw={() => {}}
          />
        );
        const quickCard = (
          <Card title="빠른 정보">
            <Kv label="모델" value={cam.model} />
            <Kv label="펌웨어" value={cam.firmware} />
            <Kv label="IP" value={cam.ip} />
            <Kv label="코덱" value={cam.codec} />
            <Kv label="해상도" value={cam.resolution} />
            <Kv label="저장소" value={`${cam.storageGb} GB`} />
          </Card>
        );
        return (
          <div className={page.csGrid}>
            {previewCard}
            {quickCard}
          </div>
        );
      })()}

      <Tabs
        tabs={SETTINGS_TABS.map((t) => ({ key: t.key, label: t.label }))}
        active={tab}
        onChange={(k) => setTab(k as SettingsTab)}
      />

      {tab === 'algorithm' && (
        <div className={page.algoLayout}>
          <div className={page.algoLeft}>
            <LivePreview
              camName={cam.name}
              camStatus={cam.status}
              videoIdx={videoIdx}
              offline={offline}
              algos={camAlgos.filter((a) => a.enabled)}
              activeAlgoId={activeAlgoId}
              drawMode={drawMode}
              onDrawComplete={handleDrawComplete}
              onPolygonRemove={handlePolygonRemove}
              onPolygonUpdate={handlePolygonUpdate}
              onCancelDraw={() => setDrawMode(false)}
            />
            <Card title="빠른 정보">
              <Kv label="모델" value={cam.model} />
              <Kv label="펌웨어" value={cam.firmware} />
              <Kv label="IP" value={cam.ip} />
              <Kv label="코덱" value={cam.codec} />
              <Kv label="해상도" value={cam.resolution} />
              <Kv label="저장소" value={`${cam.storageGb} GB`} />
            </Card>
          </div>
          <div className={page.algoRight}>
            <div
              className={[
                algoStyles.algoBanner,
                aiLimitReached ? algoStyles.algoBannerWarn : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="status"
            >
              <span>AI 특화 알고리즘은 최대 {MAX_AI_ALGOS}개까지 동시 활성화 가능합니다</span>
              <span className={algoStyles.algoBannerCount}>
                {aiEnabledCount} / {MAX_AI_ALGOS} 사용 중
              </span>
            </div>

            <Card title="기본 알고리즘">
              {basicAlgos.length === 0 ? (
                <div className={algoStyles.algoEmpty}>등록된 기본 알고리즘이 없습니다</div>
              ) : (
                <div className={algoStyles.algoGrid}>
                  {basicAlgos.map((a) => (
                    <AlgorithmCard
                      key={a.id}
                      algo={a}
                      active={a.id === activeAlgoId}
                      onActivate={() => setActiveAlgoId(a.id)}
                      onToggle={handleToggle}
                      onSensitivity={handleSensitivity}
                      onAddZone={handleAddZone}
                      onRemoveZone={handleRemoveZone}
                      onStartDraw={handleStartDraw}
                      onRemovePolygon={handleRemovePolygonFromChip}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card title="AI 특화 알고리즘">
              {aiAlgos.length === 0 ? (
                <div className={algoStyles.algoEmpty}>등록된 AI 알고리즘이 없습니다</div>
              ) : (
                <div className={algoStyles.algoGrid}>
                  {aiAlgos.map((a) => {
                    const disabled = !a.enabled && aiLimitReached;
                    return (
                      <AlgorithmCard
                        key={a.id}
                        algo={a}
                        disabled={disabled}
                        active={a.id === activeAlgoId}
                        onActivate={() => setActiveAlgoId(a.id)}
                        onToggle={handleToggle}
                        onSensitivity={handleSensitivity}
                        onAddZone={handleAddZone}
                        onRemoveZone={handleRemoveZone}
                        onStartDraw={handleStartDraw}
                        onRemovePolygon={handleRemovePolygonFromChip}
                      />
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'system' && (
        <Card title="시스템 정보">
          <div className={page.sectionCaption}>카메라 정보</div>
          <Kv label="접속 상태" value={cam.status === 'online' ? '온라인' : cam.status === 'recording' ? '녹화중' : '오프라인'} />
          <Kv label="IP 주소" value={cam.ip} />
          <Kv label="펌웨어 버전" value={cam.firmware} />
          <Kv label="모델 이름" value={cam.model} />
          <Kv label="제조번호 (S/N)" value={`S1CAM2024${cam.id.slice(-4).padStart(6, '0')}`} />
          <Kv label="빌드 날짜" value="2024-01-15" />
          <Kv label="하드웨어 버전" value="v1.2" />
          <div className={page.sectionCaption}>스트림 정보</div>
          <Kv label="해상도" value={cam.resolution} />
          <Kv label="프레임레이트" value={`${cam.fps} FPS`} />
          <Kv label="코덱" value={cam.codec} />
        </Card>
      )}

      {tab === 'osd' && (
        <Card title="OSD · 영상 보정">
          <div className={page.sectionCaption}>오버레이</div>
          <Kv label="카메라 이름" value={cam.name.split(' ').slice(1).join(' ') || cam.name} />
          <Kv label="시간 표시" value="활성" />
          <Kv label="글꼴 크기" value="보통" />
          <Kv label="위치" value="좌상단" />
          <div className={page.sectionCaption}>영상 보정</div>
          <Slider label="밝기" value={50} />
          <Slider label="대비" value={52} />
          <Slider label="채도" value={48} />
          <Slider label="선명도" value={55} />
          <Kv label="주야간 모드" value="자동" />
        </Card>
      )}

      {tab === 'video' && (
        <Card title="영상 스트림">
          <div className={page.sectionCaption}>메인 스트림</div>
          <Kv label="해상도" value={cam.resolution} />
          <Kv label="프레임레이트" value={`${cam.fps} FPS`} />
          <Kv label="코덱" value={cam.codec} />
          <Kv label="비트레이트 제어" value="VBR" />
          <Kv label="비트레이트" value="4096 Kbps" />
          <Kv label="I-Frame 간격" value="30" />
          <div className={page.sectionCaption}>서브 스트림</div>
          <Kv label="해상도" value="640×360" />
          <Kv label="프레임레이트" value="15 FPS" />
          <Kv label="코덱" value="H.264" />
          <Kv label="비트레이트" value="512 Kbps" />
        </Card>
      )}

      {tab === 'record' && (
        <Card title="녹화 정책">
          <Kv label="녹화 모드" value="연속 녹화" />
          <Kv label="녹화 스트림" value="메인 스트림" />
          <Kv label="저장 기간" value="30일" />
          <Kv label="프리레코드" value="5초" />
          <Kv label="포스트레코드" value="10초" />
          <div className={page.sectionCaption}>스케줄</div>
          <Kv label="녹화 시작" value="00:00" />
          <Kv label="녹화 종료" value="23:59" />
          <Kv label="오디오 녹음" value="비활성" />
          <Kv label="오버라이트" value="활성" />
        </Card>
      )}

      {tab === 'network' && (
        <Card title="네트워크 설정">
          <div className={page.sectionCaption}>TCP / IP</div>
          <Kv label="DHCP" value="활성" />
          <Kv label="IP 주소" value={cam.ip} />
          <Kv label="서브넷 마스크" value="255.255.255.0" />
          <Kv label="게이트웨이" value={`${cam.ip.split('.').slice(0, 3).join('.')}.1`} />
          <Kv label="DNS 서버" value="8.8.8.8" />
          <div className={page.sectionCaption}>포트</div>
          <Kv label="HTTP" value="80" />
          <Kv label="RTSP" value="554" />
          <Kv label="HTTPS" value="443" />
          <Kv label="ONVIF" value="8000" />
        </Card>
      )}
    </div>
  );
}

interface AlgorithmCardProps {
  algo: CameraAlgorithm;
  disabled?: boolean;
  active?: boolean;
  onActivate: () => void;
  onToggle: (a: CameraAlgorithm) => void;
  onSensitivity: (a: CameraAlgorithm, s: AlgorithmSensitivity) => void;
  onAddZone: (a: CameraAlgorithm) => void;
  onRemoveZone: (a: CameraAlgorithm, zoneIdx: number) => void;
  onStartDraw: (a: CameraAlgorithm) => void;
  onRemovePolygon: (a: CameraAlgorithm, polygonId: string) => void;
}

function AlgorithmCard({
  algo,
  disabled = false,
  active = false,
  onActivate,
  onToggle,
  onSensitivity,
  onAddZone,
  onRemoveZone,
  onStartDraw,
  onRemovePolygon,
}: AlgorithmCardProps) {
  const cls = [
    algoStyles.algoCard,
    algo.enabled ? algoStyles.algoCardActive : '',
    active ? algoStyles.algoCardSelected : '',
    disabled ? algoStyles.algoCardDisabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  const polygons = algo.polygons ?? [];

  return (
    <div className={cls}>
      <div
        className={algoStyles.algoHeader}
        onClick={() => {
          if (disabled) return;
          onActivate();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate();
          }
        }}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      >
        <div className={algoStyles.algoIcon} aria-hidden>
          <AlgoIcon algoKey={algo.algoKey} />
        </div>
        <div className={algoStyles.algoTitleBox}>
          <span className={algoStyles.algoLabel}>{algo.label}</span>
          <span className={algoStyles.algoDesc}>{algo.desc}</span>
        </div>
        <div className={algoStyles.algoSwitchWrap}>
          {disabled && (
            <span
              className={algoStyles.algoSwitchBadge}
              title={`AI 알고리즘 최대 개수 도달 (${MAX_AI_ALGOS})`}
            >
              제한 초과
            </span>
          )}
          <div
            className={[page.switch, algo.enabled ? page.switchOn : '']
              .filter(Boolean)
              .join(' ')}
            role="switch"
            aria-checked={algo.enabled}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={(e) => {
              e.stopPropagation();
              if (disabled) return;
              onToggle(algo);
            }}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                onToggle(algo);
              }
            }}
          >
            <span className={page.switchThumb} />
          </div>
        </div>
      </div>

      {algo.enabled && (
        <>
          <div className={algoStyles.algoRow}>
            <span className={algoStyles.algoRowLabel}>감시 영역</span>
            <div className={algoStyles.zoneList}>
              <span className={algoStyles.zoneEmpty}>
                {polygons.length === 0 ? 'ROI 없음' : `영역 ${polygons.length}개`}
              </span>
              {polygons.map((poly, i) => (
                <button
                  key={poly.id}
                  type="button"
                  className={algoStyles.zoneChip}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePolygon(algo, poly.id);
                  }}
                  title="클릭하여 삭제"
                >
                  <span>
                    영역{i + 1} · {poly.points.length}점
                  </span>
                  <span className={algoStyles.zoneChipX} aria-hidden>
                    ×
                  </span>
                </button>
              ))}
              <button
                type="button"
                className={algoStyles.zoneAddBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartDraw(algo);
                }}
              >
                + 영역 그리기
              </button>
            </div>
          </div>

          {algo.zones.length > 0 && (
            <div className={algoStyles.algoRow}>
              <span className={algoStyles.algoRowLabel}>라벨</span>
              <div className={algoStyles.zoneList}>
                {algo.zones.map((z, idx) => (
                  <button
                    key={`${algo.id}-${idx}-${z}`}
                    type="button"
                    className={algoStyles.zoneChip}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveZone(algo, idx);
                    }}
                    title="클릭하여 삭제"
                  >
                    <span>{z}</span>
                    <span className={algoStyles.zoneChipX} aria-hidden>
                      ×
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className={algoStyles.zoneAddBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddZone(algo);
                  }}
                >
                  + 라벨 추가
                </button>
              </div>
            </div>
          )}

          <div className={algoStyles.algoRow}>
            <span className={algoStyles.algoRowLabel}>민감도</span>
            <BtnGroup>
              {SENSITIVITY_OPTIONS.map((opt) => (
                <BtnGroup.Btn
                  key={opt.value}
                  active={algo.sensitivity === opt.value}
                  onClick={(e) => { e.stopPropagation(); onSensitivity(algo, opt.value); }}
                >
                  {opt.label}
                </BtnGroup.Btn>
              ))}
            </BtnGroup>
          </div>
        </>
      )}
    </div>
  );
}
