// 사이트 관리 — 계약처(트리 최상위) ▸ 사이트(장소그룹, 카메라 단일 홈) ▸ 카메라 + 미지정,
// 그리고 계약처를 가로지르는 즐겨찾기(다중 참조). 여기서 만든 배치가 카메라관리 트리에 반영된다.
// TODO: replace with fetch('/api/v1/{contracts,sites,cameras,favorites}')
import React, { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import type { Camera, Contract, Site as SiteRecord } from '@/types';
import bldg01 from '@/assets/images/panel-2026-04-28/site_card_bldg_01.png';
import bldg02 from '@/assets/images/panel-2026-04-28/site_card_bldg_02.png';
import bldg03 from '@/assets/images/panel-2026-04-28/site_card_bldg_03.png';
import page from './Page.module.css';
import styles from './Site.module.css';

const THUMB_IMGS = [bldg01, bldg02, bldg03];

/** 카메라 ID 뒷자리 숫자로 썸네일 이미지 결정 */
function thumbImg(camId: string) {
  const n = parseInt(camId.replace(/\D/g, '') || '0', 10);
  return THUMB_IMGS[n % THUMB_IMGS.length];
}

/** ISO 문자열 → HH:MM:SS */
function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
  catch { return '00:00:00'; }
}

type Sel =
  | { kind: 'contract'; id: string }
  | { kind: 'site'; id: string }
  | { kind: 'favorite'; id: string }
  | { kind: 'unassigned'; id: string } // id = contractId
  | null;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={[styles.chevron, open ? styles.chevronOpen : ''].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function StatusDot({ online }: { online: boolean }) {
  return <span className={[styles.dot, online ? styles.dotOn : styles.dotOff].join(' ')} aria-hidden />;
}

const FLAG_TAGS: { key: keyof Camera['flags']; label: string }[] = [
  { key: 'intrusionDetection', label: '침입감지' },
  { key: 'faceMatching',       label: '얼굴인식' },
  { key: 'lpr',                label: '번호판' },
  { key: 'lineCrossing',       label: '선월경' },
];

const STATUS_MAP: Record<Camera['status'], { label: string; cls: string }> = {
  recording: { label: '녹화중',   cls: styles.camThumbStatusRecording },
  online:    { label: '온라인',   cls: styles.camThumbStatusOnline },
  offline:   { label: '오프라인', cls: styles.camThumbStatusOffline },
};

function CamCard({ cam, footer }: { cam: Camera; footer?: React.ReactNode }) {
  const tags   = FLAG_TAGS.filter((f) => cam.flags[f.key]).map((f) => f.label);
  const status = STATUS_MAP[cam.status];
  const isOffline = cam.status === 'offline';
  return (
    <div className={styles.camCard}>
      {/* 영상 썸네일 — CCTV 뷰 */}
      <div className={styles.camThumb}>
        <img
          src={thumbImg(cam.id)}
          alt=""
          className={[styles.camThumbImg, isOffline ? styles.camThumbImgOffline : ''].filter(Boolean).join(' ')}
        />
        {/* 어두운 틴트 + 스캔라인 */}
        <div className={styles.camThumbOverlay} />
        <div className={styles.camThumbScanlines} />
        {/* 오프라인: NO SIGNAL */}
        {isOffline && (
          <div className={styles.camThumbNoSignal}>NO SIGNAL</div>
        )}
        {/* 좌하단: 카메라 ID + 타임스탬프 */}
        {!isOffline && (
          <div className={styles.camThumbHud}>
            <span className={styles.camThumbHudId}>{cam.id.replace('cam-', 'CAM-').toUpperCase()}</span>
            <span className={styles.camThumbHudTime}>{fmtTime(cam.updatedAt)}</span>
          </div>
        )}
        {/* 우상단: 상태 배지 */}
        <span className={[styles.camThumbStatus, status.cls].join(' ')}>{status.label}</span>
      </div>
      {/* 카드 본문 */}
      <div className={styles.camCardBody}>
        <div className={styles.camCardName}>{cam.name}</div>
        <div className={styles.camCardModel}>{cam.model}</div>
        {tags.length > 0 && (
          <div className={styles.camCardTags}>
            {tags.map((t) => <span key={t} className={styles.camCardTag}>{t}</span>)}
          </div>
        )}
        {footer && <div className={styles.camCardFooter}>{footer}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   카메라 추가 모달
───────────────────────────────────────────────────── */
function CameraAddModal({
  siteId,
  siteName,
  myContracts,
  allCameras,
  allSites,
  onClose,
  onConfirm,
}: {
  siteId: string;
  siteName: string;
  myContracts: Contract[];
  allCameras: Camera[];
  allSites: SiteRecord[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // ESC 닫기
  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  // 이 사이트에 없는 카메라를 계약처별로 그룹핑
  const groups = myContracts
    .map((c) => ({
      contract: c,
      cams: allCameras.filter((cam) => cam.contractId === c.id && cam.siteId !== siteId),
    }))
    .filter((g) => g.cams.length > 0);

  const toggleCam = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleGroup = (cams: Camera[]) => {
    const allSel = cams.every((c) => selected.has(c.id));
    setSelected((prev) => {
      const n = new Set(prev);
      allSel ? cams.forEach((c) => n.delete(c.id)) : cams.forEach((c) => n.add(c.id));
      return n;
    });
  };

  const homeLabel = (cam: Camera) =>
    cam.siteId ? allSites.find((s) => s.id === cam.siteId)?.name ?? '' : '미지정';

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>카메라 추가</div>
            <div className={styles.modalSub}>{siteName}에 추가할 카메라를 선택하세요</div>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="닫기">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 — 계약처 그룹 */}
        <div className={styles.modalBody}>
          {groups.length === 0 ? (
            <div className={styles.empty2}>추가할 수 있는 카메라가 없습니다.</div>
          ) : groups.map(({ contract, cams }) => {
            const allSel = cams.every((c) => selected.has(c.id));
            return (
              <div key={contract.id} className={styles.modalGroup}>
                <div className={styles.modalGroupHeader}>
                  <span className={styles.modalGroupName}>{contract.name}</span>
                  <span className={styles.modalGroupCode}>{contract.code}</span>
                  <button type="button" className={styles.modalSelectAll} onClick={() => toggleGroup(cams)}>
                    {allSel ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <div className={styles.modalCamList}>
                  {cams.map((cam) => {
                    const isSel = selected.has(cam.id);
                    return (
                      <label
                        key={cam.id}
                        className={[styles.modalCamRow, isSel ? styles.modalCamRowSelected : ''].filter(Boolean).join(' ')}
                      >
                        <input
                          type="checkbox"
                          className={styles.modalCheckbox}
                          checked={isSel}
                          onChange={() => toggleCam(cam.id)}
                        />
                        <StatusDot online={cam.status !== 'offline'} />
                        <span className={styles.modalCamName}>{cam.name}</span>
                        <span className={styles.modalCamHome}>{homeLabel(cam)}</span>
                        <span className={styles.modalCamModel}>{cam.model}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 푸터 */}
        <div className={styles.modalFooter}>
          <span className={styles.modalCount}>
            {selected.size > 0 ? `${selected.size}개 선택됨` : '카메라를 선택하세요'}
          </span>
          <div className={styles.modalFooterBtns}>
            <button type="button" className={styles.rowBtn} onClick={onClose}>취소</button>
            <button
              type="button"
              className={styles.rowBtnPrimary}
              disabled={selected.size === 0}
              onClick={() => onConfirm([...selected])}
            >
              이 사이트로 추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Site() {
  const contracts = useDataStore((s) => s.contracts);
  const sites = useDataStore((s) => s.sites);
  const cameras = useDataStore((s) => s.cameras);
  const favorites = useDataStore((s) => s.favorites);
  const currentCompanyId = useDataStore((s) => s.currentCompanyId);
  const updateSite = useDataStore((s) => s.updateSite);
  const addSite = useDataStore((s) => s.addSite);
  const removeSite = useDataStore((s) => s.removeSite);
  const assignCameraToSite = useDataStore((s) => s.assignCameraToSite);
  const addFavorite = useDataStore((s) => s.addFavorite);
  const updateFavorite = useDataStore((s) => s.updateFavorite);
  const removeFavorite = useDataStore((s) => s.removeFavorite);
  const toggleFavoriteCamera = useDataStore((s) => s.toggleFavoriteCamera);
  const moveSite = useDataStore((s) => s.moveSite);
  const moveFavorite = useDataStore((s) => s.moveFavorite);
  const toast = useToast();

  // 현재 고객(계정) 기준 스코프 — 한 고객이 여러 계약처를 보유.
  const myContracts = useMemo(() => contracts.filter((c) => c.companyId === currentCompanyId), [contracts, currentCompanyId]);
  const myContractIds = useMemo(() => new Set(myContracts.map((c) => c.id)), [myContracts]);
  const myFavorites = useMemo(() => favorites.filter((f) => f.ownerId === currentCompanyId), [favorites, currentCompanyId]);
  const ownerId = currentCompanyId;

  const [openContracts, setOpenContracts] = useState<Set<string>>(() => new Set(myContracts.slice(0, 1).map((c) => c.id)));
  const [openSites, setOpenSites] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Sel>(() =>
    myContracts[0] ? { kind: 'contract', id: myContracts[0].id } : null,
  );
  const [showPool, setShowPool] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [poolContract, setPoolContract] = useState<string>(''); // 즐겨찾기 풀 계약처 필터
  // 인라인 이름변경 / 드래그 순서변경
  const [editing, setEditing] = useState<{ kind: 'site' | 'favorite'; id: string } | null>(null);
  const [editVal, setEditVal] = useState('');
  const [dragSite, setDragSite] = useState<string | null>(null);
  const [dragOverSite, setDragOverSite] = useState<string | null>(null);
  const [dragFav, setDragFav] = useState<string | null>(null);
  const [dragOverFav, setDragOverFav] = useState<string | null>(null);

  const camsByContract = useMemo(() => {
    const m = new Map<string, Camera[]>();
    for (const c of cameras) {
      const arr = m.get(c.contractId) ?? [];
      arr.push(c);
      m.set(c.contractId, arr);
    }
    return m;
  }, [cameras]);

  // 계약처 참조 표시는 계약명(예: 에스원빌딩). 번호(N******)는 별도로 노출.
  const contractLabel = (id: string) => contracts.find((x) => x.id === id)?.name ?? id;
  const sitesOf = (contractId: string) => sites.filter((s) => s.contractId === contractId);
  const camsOf = (siteId: string) => cameras.filter((c) => c.siteId === siteId);
  const unassignedOf = (contractId: string) =>
    cameras.filter((c) => c.contractId === contractId && c.siteId === null);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) =>
    set((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const select = (s: Sel) => {
    setSel(s);
    setShowPool(false);
    setShowAddModal(false);
    setPoolContract('');
  };

  const beginEdit = (kind: 'site' | 'favorite', id: string, current: string) => {
    setEditing({ kind, id });
    setEditVal(current);
  };
  const commitEdit = () => {
    if (!editing) return;
    const v = editVal.trim();
    if (v) {
      if (editing.kind === 'site') updateSite(editing.id, { name: v });
      else updateFavorite(editing.id, { name: v });
    }
    setEditing(null);
  };

  /* ── 액션 ── */
  const handleAddFavorite = () => {
    const id = addFavorite(ownerId, '새 즐겨찾기');
    select({ kind: 'favorite', id });
    toast.success('즐겨찾기 생성', '카메라를 추가해 보세요.');
  };
  const handleAddSite = (contractId: string) => {
    const id = addSite({ name: '새 사이트', address: '', contractId });
    setOpenContracts((p) => new Set(p).add(contractId));
    select({ kind: 'site', id });
    toast.success('사이트 생성', '이름과 카메라를 설정해 주세요.');
  };

  return (
    <div className={page.page}>
      <div className={styles.layout}>
        {/* ───────── 좌측 트리 ───────── */}
        <div className={styles.tree}>
          <div className={styles.sectionLabel}>내 장소 (계약처 ▸ 사이트)</div>
          {myContracts.map((c) => {
            const cOpen = openContracts.has(c.id);
            const cSites = sitesOf(c.id);
            const unassigned = unassignedOf(c.id);
            return (
              <div key={c.id}>
                <div
                  role="button"
                  tabIndex={0}
                  className={[styles.node, sel?.kind === 'contract' && sel.id === c.id ? styles.nodeActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    const isSelected = sel?.kind === 'contract' && sel.id === c.id;
                    if (isSelected) {
                      toggle(setOpenContracts, c.id);          // 이미 선택된 상태 → 접기/펼치기
                    } else {
                      setOpenContracts((p) => new Set(p).add(c.id)); // 미선택 → 펼치고
                      select({ kind: 'contract', id: c.id });        // 선택
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const isSelected = sel?.kind === 'contract' && sel.id === c.id;
                      if (isSelected) toggle(setOpenContracts, c.id);
                      else { setOpenContracts((p) => new Set(p).add(c.id)); select({ kind: 'contract', id: c.id }); }
                    }
                  }}
                >
                  <Chevron open={cOpen} />
                  <span className={styles.nodeLabel} style={{ flex: '0 1 auto', fontWeight: 700 }}>{c.name}</span>
                  <span className={styles.nodeCode} style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>{c.code}</span>
                  <span style={{ flex: 1 }} aria-hidden />
                  <div className={styles.nodeActions}>
                    <button type="button" className={styles.iconBtn} title="사이트 추가" onClick={(e) => { e.stopPropagation(); handleAddSite(c.id); }}>＋</button>
                  </div>
                </div>

                {cOpen && (
                  <>
                    {cSites.map((st) => {
                      const sOpen = openSites.has(st.id);
                      const sCams = camsOf(st.id);
                      return (
                        <div key={st.id}>
                          <div
                            role="button"
                            tabIndex={0}
                            draggable
                            className={[styles.node, styles.lvl1,
                              sel?.kind === 'site' && sel.id === st.id ? styles.nodeActive : '',
                              dragOverSite === st.id ? styles.dragOver : '',
                              dragSite === st.id ? styles.dragging : ''].filter(Boolean).join(' ')}
                            onClick={() => {
                              const isSelected = sel?.kind === 'site' && sel.id === st.id;
                              if (isSelected) {
                                toggle(setOpenSites, st.id);
                              } else {
                                setOpenSites((p) => new Set(p).add(st.id));
                                select({ kind: 'site', id: st.id });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                const isSelected = sel?.kind === 'site' && sel.id === st.id;
                                if (isSelected) toggle(setOpenSites, st.id);
                                else { setOpenSites((p) => new Set(p).add(st.id)); select({ kind: 'site', id: st.id }); }
                              }
                            }}
                            onDragStart={() => setDragSite(st.id)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverSite(st.id); }}
                            onDragLeave={() => setDragOverSite((p) => (p === st.id ? null : p))}
                            onDrop={(e) => { e.preventDefault(); if (dragSite && dragSite !== st.id) moveSite(dragSite, st.id); setDragSite(null); setDragOverSite(null); }}
                            onDragEnd={() => { setDragSite(null); setDragOverSite(null); }}
                          >
                            <Chevron open={sOpen} />
                            <span className={styles.nodeLabel}>{st.name}</span>
                            <span className={styles.nodeCount}>{sCams.length}</span>
                          </div>
                          {sOpen &&
                            sCams.map((cam) => (
                              <div key={cam.id} className={[styles.node, styles.lvl2].join(' ')}>
                                <StatusDot online={cam.status !== 'offline'} />
                                <span className={styles.nodeLabel}>{cam.name}</span>
                              </div>
                            ))}
                          {sOpen && sCams.length === 0 && (
                            <div className={[styles.node, styles.lvl2].join(' ')} style={{ color: 'var(--color-text-tertiary)' }}>
                              카메라 없음
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div
                      role="button"
                      tabIndex={0}
                      className={[styles.node, styles.lvl1, sel?.kind === 'unassigned' && sel.id === c.id ? styles.nodeActive : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => select({ kind: 'unassigned', id: c.id })}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select({ kind: 'unassigned', id: c.id }); } }}
                    >
                      <span style={{ width: 14 }} aria-hidden />
                      <span className={styles.nodeLabel}>📁 미지정</span>
                      <span className={styles.nodeCount}>{unassigned.length}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <div className={styles.sectionLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⭐ 즐겨찾기 (보기)</span>
            <button type="button" className={styles.iconBtn} title="즐겨찾기 추가" onClick={handleAddFavorite}>＋</button>
          </div>
          {myFavorites.length === 0 && (
            <div className={styles.node} style={{ color: 'var(--color-text-tertiary)', cursor: 'default' }}>
              아직 없음
            </div>
          )}
          {myFavorites.map((f) => {
            const isEditing = editing?.kind === 'favorite' && editing.id === f.id;
            return (
              <div
                key={f.id}
                role="button"
                tabIndex={0}
                draggable={!isEditing}
                className={[styles.node,
                  sel?.kind === 'favorite' && sel.id === f.id ? styles.nodeActive : '',
                  dragOverFav === f.id ? styles.dragOver : '',
                  dragFav === f.id ? styles.dragging : ''].filter(Boolean).join(' ')}
                onClick={() => { if (!isEditing) select({ kind: 'favorite', id: f.id }); }}
                onKeyDown={(e) => { if (!isEditing && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select({ kind: 'favorite', id: f.id }); } }}
                onDragStart={() => setDragFav(f.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverFav(f.id); }}
                onDragLeave={() => setDragOverFav((p) => (p === f.id ? null : p))}
                onDrop={(e) => { e.preventDefault(); if (dragFav && dragFav !== f.id) moveFavorite(dragFav, f.id); setDragFav(null); setDragOverFav(null); }}
                onDragEnd={() => { setDragFav(null); setDragOverFav(null); }}
              >
                <span className={styles.fav} aria-hidden>★</span>
                {isEditing ? (
                  <input className={styles.inlineInput} autoFocus value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitEdit(); } else if (e.key === 'Escape') { e.preventDefault(); setEditing(null); } }}
                    onBlur={commitEdit} />
                ) : (
                  <span className={styles.nodeLabel}>{f.name}</span>
                )}
                <div className={styles.nodeActions}>
                  <button type="button" className={styles.iconBtn} title="이름 변경" onClick={(e) => { e.stopPropagation(); beginEdit('favorite', f.id, f.name); }}>✎</button>
                  <button type="button" className={[styles.iconBtn, styles.iconBtnDanger].join(' ')} title="삭제" onClick={(e) => { e.stopPropagation(); removeFavorite(f.id); if (sel?.kind === 'favorite' && sel.id === f.id) select(null); toast.info('즐겨찾기 삭제', f.name); }}>🗑</button>
                </div>
                <span className={styles.nodeCount}>{f.cameraIds.length}</span>
              </div>
            );
          })}
        </div>

        {/* ───────── 우측 상세 ───────── */}
        <div className={styles.detail}>
          {!sel && <div className={styles.empty}>왼쪽에서 계약처·사이트·즐겨찾기를 선택하세요.</div>}

          {sel?.kind === 'contract' && (() => {
            const c = contracts.find((x) => x.id === sel.id);
            if (!c) return null;
            const cSites = sitesOf(c.id);
            const cCams = camsByContract.get(c.id) ?? [];
            return (
              <>
                <Card>
                  <div className={styles.detailHead} style={{ marginBottom: 14 }}>
                    <div>
                      <div className={styles.detailKicker}>계약처</div>
                      <h2 className={styles.detailTitle}>
                        {c.name}{' '}
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{c.code}</span>
                      </h2>
                    </div>
                    <Badge tone={c.status === 'active' ? 'success' : 'warn'} dot>
                      {c.status === 'active' ? '활성' : c.status === 'suspended' ? '일시중지' : '만료'}
                    </Badge>
                  </div>
                  <div className={page.kvRow}><span className={page.kvLabel}>계약번호</span><span className={page.kvVal} style={{ fontFamily: 'var(--font-mono)' }}>{c.code}</span></div>
                  <div className={page.kvRow}><span className={page.kvLabel}>사이트</span><span className={page.kvVal}>{cSites.length}개</span></div>
                  <div className={page.kvRow}><span className={page.kvLabel}>카메라</span><span className={page.kvVal}>{cCams.length}대</span></div>
                  <div className={styles.empty2} style={{ marginTop: 8 }}>
                    계약번호는 가입 시 자동 부여되는 고객 계정 번호예요. 지점·장소는 아래 사이트로 직접 구성합니다.
                  </div>
                </Card>
                <Card title={`전체 카메라 (${cCams.length})`}>
                  {cCams.length === 0 ? (
                    <div className={styles.empty2}>등록된 카메라가 없습니다.</div>
                  ) : (
                    <div className={styles.camSiteGroups}>
                      {cSites.map((site) => {
                        const sCams = camsOf(site.id);
                        if (sCams.length === 0) return null;
                        return (
                          <div key={site.id} className={styles.camSiteGroup}>
                            <div className={styles.camSiteLabel}>{site.name}</div>
                            <div className={styles.camGrid}>
                              {sCams.map((cam) => (
                                <CamCard key={cam.id} cam={cam} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
                <Card title={`사이트 (${cSites.length})`} actions={<Button variant="primary" size="sm" onClick={() => handleAddSite(c.id)}>+ 사이트 추가</Button>}>
                  <div className={styles.camList}>
                    {cSites.length === 0 && <div className={styles.empty2}>사이트가 없습니다. 추가해 카메라를 묶어보세요.</div>}
                    {cSites.map((st) => (
                      <div key={st.id} className={styles.camItem}>
                        <span className={styles.camName}>{st.name}</span>
                        <span className={styles.camHome}>{camsOf(st.id).length}대</span>
                        <button type="button" className={styles.rowBtn} onClick={() => select({ kind: 'site', id: st.id })}>열기</button>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            );
          })()}

          {sel?.kind === 'site' && (() => {
            const st = sites.find((x) => x.id === sel.id);
            if (!st) return null;
            const inSite = camsOf(st.id);
            // 같은 계약처에서 이 사이트에 없는 카메라 = 이동 후보 (TODO: 카메라 이동 기능 구현 시 사용)
            // const candidates = cameras.filter((c) => c.contractId === st.contractId && c.siteId !== st.id);
            return (
              <>
                <div className={styles.detailHead}>
                  <div>
                    <div className={styles.detailKicker}>사이트 · {contractLabel(st.contractId)}</div>
                    <h2 className={styles.detailTitle}>{st.name || '(이름 없음)'}</h2>
                  </div>
                  <button
                    type="button"
                    className={[styles.rowBtn, styles.rowBtnDanger].join(' ')}
                    onClick={() => { removeSite(st.id); select({ kind: 'contract', id: st.contractId }); toast.info('사이트 삭제', '소속 카메라는 미지정으로 이동했어요.'); }}
                  >
                    삭제
                  </button>
                </div>
                <Card title="사이트 정보">
                  <Input label="사이트 이름" value={st.name} placeholder="예: 1층, 카운터" onChange={(e) => updateSite(st.id, { name: e.target.value })} />
                  <Input label="주소 (선택)" value={st.address} placeholder="서울특별시 …" onChange={(e) => updateSite(st.id, { address: e.target.value })} />
                </Card>
                <Card
                  title={`카메라 (${inSite.length})`}
                  actions={<Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>+ 카메라 추가</Button>}
                >
                  {inSite.length === 0 ? (
                    <div className={styles.empty2}>이 사이트에 배치된 카메라가 없습니다.</div>
                  ) : (
                    <div className={styles.camGrid}>
                      {inSite.map((c) => (
                        <CamCard
                          key={c.id}
                          cam={c}
                          footer={
                            <button
                              type="button"
                              className={[styles.rowBtn, styles.rowBtnDanger, styles.rowBtnFull].join(' ')}
                              onClick={() => { assignCameraToSite(c.id, null); toast.info('미지정으로', c.name); }}
                            >
                              사이트에서 빼기
                            </button>
                          }
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </>
            );
          })()}

          {sel?.kind === 'unassigned' && (() => {
            const c = contracts.find((x) => x.id === sel.id);
            if (!c) return null;
            const list = unassignedOf(c.id);
            const cSites = sitesOf(c.id);
            return (
              <>
                <div className={styles.detailHead}>
                  <div>
                    <div className={styles.detailKicker}>미지정 · {contractLabel(c.id)}</div>
                    <h2 className={styles.detailTitle}>사이트 미배정 카메라</h2>
                  </div>
                </div>
                <Card title={`미지정 (${list.length})`}>
                  <div className={styles.camList}>
                    {list.length === 0 && <div className={styles.empty2}>모든 카메라가 사이트에 배치되었습니다.</div>}
                    {list.map((cam) => (
                      <div key={cam.id} className={styles.camItem}>
                        <StatusDot online={cam.status !== 'offline'} />
                        <span className={styles.camName}>{cam.name}</span>
                        <div style={{ width: 160 }}>
                          <Select
                            size="sm"
                            value=""
                            options={[{ value: '', label: '사이트로 이동…' }, ...cSites.map((s) => ({ value: s.id, label: s.name }))]}
                            onChange={(v) => { if (v) { assignCameraToSite(cam.id, v); toast.success('이동됨', `${cam.name} → ${cSites.find((s) => s.id === v)?.name ?? ''}`); } }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {cSites.length === 0 && <div className={styles.empty2} style={{ marginTop: 10 }}>먼저 계약처에 사이트를 추가하세요.</div>}
                </Card>
              </>
            );
          })()}

          {sel?.kind === 'favorite' && (() => {
            const f = favorites.find((x) => x.id === sel.id);
            if (!f) return null;
            const members = f.cameraIds.map((id) => cameras.find((c) => c.id === id)).filter(Boolean) as Camera[];
            const pool = cameras.filter(
              (c) => myContractIds.has(c.contractId) && (!poolContract || c.contractId === poolContract),
            );
            const homeLabel = (c: Camera) => (c.siteId ? sites.find((s) => s.id === c.siteId)?.name ?? '' : '미지정');
            return (
              <>
                <div className={styles.detailHead}>
                  <div>
                    <div className={styles.detailKicker}>즐겨찾기 (계약처 가로지름 · 참조)</div>
                    <h2 className={styles.detailTitle}>{f.name}</h2>
                  </div>
                  <button type="button" className={[styles.rowBtn, styles.rowBtnDanger].join(' ')} onClick={() => { removeFavorite(f.id); select(null); toast.info('즐겨찾기 삭제', f.name); }}>삭제</button>
                </div>
                <Card title="보기 정보">
                  <Input label="보기 이름" value={f.name} onChange={(e) => updateFavorite(f.id, { name: e.target.value })} />
                </Card>
                <Card
                  title={`포함 카메라 (${members.length})`}
                  actions={<Button variant="secondary" size="sm" onClick={() => setShowPool((v) => !v)}>{showPool ? '닫기' : '+ 카메라 추가'}</Button>}
                >
                  {showPool && (
                    <div style={{ marginBottom: 12 }}>
                      <div className={styles.poolFilter}>
                        <button type="button" className={[styles.chip, poolContract === '' ? styles.chipActive : ''].filter(Boolean).join(' ')} onClick={() => setPoolContract('')}>전체</button>
                        {myContracts.map((c) => (
                          <button key={c.id} type="button" className={[styles.chip, poolContract === c.id ? styles.chipActive : ''].filter(Boolean).join(' ')} onClick={() => setPoolContract(c.id)}>{contractLabel(c.id)}</button>
                        ))}
                      </div>
                      <div className={styles.camList}>
                        {pool.map((c) => {
                          const on = f.cameraIds.includes(c.id);
                          return (
                            <div key={c.id} className={styles.camItem}>
                              <StatusDot online={c.status !== 'offline'} />
                              <span className={styles.camName}>{c.name}</span>
                              <span className={styles.camHome}>{contractLabel(c.contractId)} · {homeLabel(c)}</span>
                              <button type="button" className={[styles.rowBtn, on ? styles.rowBtnOn : ''].filter(Boolean).join(' ')} onClick={() => toggleFavoriteCamera(f.id, c.id)}>{on ? '추가됨' : '추가'}</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className={styles.camList}>
                    {members.length === 0 && <div className={styles.empty2}>아직 담긴 카메라가 없습니다. ‘+ 카메라 추가’로 전 지점에서 골라보세요.</div>}
                    {members.map((c) => (
                      <div key={c.id} className={styles.camItem}>
                        <StatusDot online={c.status !== 'offline'} />
                        <span className={styles.camName}>{c.name}</span>
                        <span className={styles.camHome}>{contractLabel(c.contractId)} · {homeLabel(c)}</span>
                        <button type="button" className={[styles.rowBtn, styles.rowBtnDanger].join(' ')} onClick={() => toggleFavoriteCamera(f.id, c.id)}>제거</button>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            );
          })()}
        </div>
      </div>

      {/* 카메라 추가 모달 */}
      {showAddModal && sel?.kind === 'site' && (() => {
        const st = sites.find((x) => x.id === sel.id);
        if (!st) return null;
        return (
          <CameraAddModal
            siteId={st.id}
            siteName={st.name}
            myContracts={myContracts}
            allCameras={cameras}
            allSites={sites}
            onClose={() => setShowAddModal(false)}
            onConfirm={(ids) => {
              ids.forEach((id) => assignCameraToSite(id, st.id));
              toast.success('카메라 추가', `${ids.length}대를 ${st.name}에 추가했습니다.`);
              setShowAddModal(false);
            }}
          />
        );
      })()}
    </div>
  );
}
