// 감지 영역(ROI) 라이브 프리뷰 — 카메라 영상 위에 다각형 영역을 그리고 편집한다.
// 카메라 설정(프라이버시 마스크)과 안심 AI 설정(감지 영역)에서 공용으로 사용.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { CameraAlgorithm, ZonePoint, ZonePolygon } from '@/types';
import page from '@/pages/Page.module.css';

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

export interface RoiPreviewProps {
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

export function RoiPreview({
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
}: RoiPreviewProps) {
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

  useEffect(() => {
    if (!drawMode) {
      setVertices([]);
      setCursor(null);
    }
  }, [drawMode]);

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
    if (e.detail >= 2) return;
    e.preventDefault();
    const pt = getXY(e);
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
    if (vertices.length >= 3) completeDraw(vertices);
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

  const handlePolyMouseDown = (e: React.MouseEvent, algoId: string, poly: ZonePolygon) => {
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
    if (dragPoly) setDragPoly(null);
  };

  const cursorStyle: React.CSSProperties = drawMode && !offline
    ? { cursor: 'crosshair' }
    : dragPoly
      ? { cursor: 'grabbing' }
      : {};

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

        <svg className={page.previewSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden={!drawMode}>
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
              {drawMode && vertices.length >= 3 && (
                <polygon points={vertices.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')} fill="black" />
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
              const firstShifted = first ? { x: first.x + shift.dx, y: first.y + shift.dy } : null;
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
                      if (dragPoly?.moved) return;
                      setSelectedPolygon(sel ? null : poly.id);
                    }}
                  />
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
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))', pointerEvents: 'none' }}
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

          {drawMode && vertices.length > 0 && (
            <g style={{ pointerEvents: 'none' }}>
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
                    style={{ left: `${b.maxX * 100}%`, top: `${b.minY * 100}%` }}
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
