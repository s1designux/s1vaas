// 사이트 관리 — 계약처(트리 최상위) ▸ 사이트(장소그룹, 카메라 단일 홈) ▸ 카메라 + 미지정,
// 그리고 계약처를 가로지르는 즐겨찾기(다중 참조). 여기서 만든 배치가 카메라관리 트리에 반영된다.
// TODO: replace with fetch('/api/v1/{contracts,sites,cameras,favorites}')
import { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import type { Camera } from '@/types';
import page from './Page.module.css';
import styles from './Site.module.css';

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

export default function Site() {
  const contracts = useDataStore((s) => s.contracts);
  const sites = useDataStore((s) => s.sites);
  const cameras = useDataStore((s) => s.cameras);
  const favorites = useDataStore((s) => s.favorites);
  const companies = useDataStore((s) => s.companies);
  const currentCompanyId = useDataStore((s) => s.currentCompanyId);
  const setCurrentCompany = useDataStore((s) => s.setCurrentCompany);
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
  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const ownerId = currentCompanyId;

  const [openContracts, setOpenContracts] = useState<Set<string>>(() => new Set(myContracts.slice(0, 1).map((c) => c.id)));
  const [openSites, setOpenSites] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Sel>(null);
  const [showPool, setShowPool] = useState(false);
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

  // 고객(계정) 전환 — 데모용. 실제 앱은 로그인 companyId 로 고정.
  const switchCustomer = (id: string) => {
    setCurrentCompany(id);
    setSel(null);
    setShowPool(false);
    setPoolContract('');
    const first = contracts.find((c) => c.companyId === id);
    setOpenContracts(new Set(first ? [first.id] : []));
    setOpenSites(new Set());
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
      <div className={page.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div className={page.headerKicker}>사이트 관리</div>
          <h1 className={page.headerTitle}>사이트 관리</h1>
          <p className={page.headerSubtitle}>
            한 고객(계정)이 여러 계약처를 가질 수 있어요. 계약처별로 카메라를 사이트(장소)로 묶고,
            여러 계약처를 가로지르는 즐겨찾기 보기를 만들 수 있어요. 여기서 만든 구성이 카메라 관리 메뉴에 반영됩니다.
          </p>
        </div>
        <div style={{ minWidth: 220, flexShrink: 0 }}>
          <Select
            label="고객 (계정)"
            size="sm"
            value={currentCompanyId}
            options={companies.map((co) => ({
              value: co.id,
              label: `${co.name} · 계약처 ${contracts.filter((c) => c.companyId === co.id).length}`,
            }))}
            onChange={switchCustomer}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'right', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--color-text-secondary)' }}>{currentCompany?.name ?? '—'}</b> · 계약번호 {myContracts.map((c) => c.code).join(' · ') || '—'}
            <br />
            카메라 {cameras.filter((c) => myContractIds.has(c.contractId)).length}대
          </div>
        </div>
      </div>

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
                  onClick={() => { toggle(setOpenContracts, c.id); select({ kind: 'contract', id: c.id }); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(setOpenContracts, c.id); select({ kind: 'contract', id: c.id }); } }}
                >
                  <Chevron open={cOpen} />
                  <span className={styles.nodeLabel} style={{ flex: '0 1 auto' }}>{c.name}</span>
                  <span className={styles.nodeCode}>{c.code}</span>
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
                            onClick={() => { toggle(setOpenSites, st.id); select({ kind: 'site', id: st.id }); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(setOpenSites, st.id); select({ kind: 'site', id: st.id }); } }}
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
                <div className={styles.detailHead}>
                  <div>
                    <div className={styles.detailKicker}>계약처</div>
                    <h2 className={styles.detailTitle}>
                      {c.name}{' '}
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>{c.code}</span>
                    </h2>
                  </div>
                  <Badge tone={c.status === 'active' ? 'success' : 'warn'} dot>
                    {c.status === 'active' ? '활성' : c.status === 'suspended' ? '일시중지' : '만료'}
                  </Badge>
                </div>
                <Card title="계약처 정보">
                  <div className={page.kvRow}><span className={page.kvLabel}>계약번호</span><span className={page.kvVal} style={{ fontFamily: 'var(--font-mono)' }}>{c.code}</span></div>
                  <div className={page.kvRow}><span className={page.kvLabel}>사이트</span><span className={page.kvVal}>{cSites.length}개</span></div>
                  <div className={page.kvRow}><span className={page.kvLabel}>카메라</span><span className={page.kvVal}>{cCams.length}대</span></div>
                  <div className={styles.empty2} style={{ marginTop: 8 }}>
                    계약번호는 가입 시 자동 부여되는 고객 계정 번호예요. 지점·장소는 아래 사이트로 직접 구성합니다.
                  </div>
                </Card>
                <Card title={`전체 카메라 (${cCams.length})`}>
                  <div className={styles.camList}>
                    {cCams.length === 0 && <div className={styles.empty2}>등록된 카메라가 없습니다.</div>}
                    {cCams.map((cam) => (
                      <div key={cam.id} className={styles.camItem}>
                        <StatusDot online={cam.status !== 'offline'} />
                        <span className={styles.camName}>{cam.name}</span>
                        <span className={styles.camHome}>{cam.siteId ? sites.find((s) => s.id === cam.siteId)?.name ?? '' : '미지정'}</span>
                      </div>
                    ))}
                  </div>
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
            // 같은 계약처에서 이 사이트에 없는 카메라 = 이동 후보
            const candidates = cameras.filter((c) => c.contractId === st.contractId && c.siteId !== st.id);
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
                  actions={<Button variant="secondary" size="sm" onClick={() => setShowPool((v) => !v)}>{showPool ? '닫기' : '+ 카메라 추가'}</Button>}
                >
                  {showPool && (
                    <div style={{ marginBottom: 12 }}>
                      <div className={page.kvLabel} style={{ marginBottom: 6 }}>이 계약처의 다른 카메라 (선택 시 이 사이트로 이동)</div>
                      <div className={styles.camList}>
                        {candidates.length === 0 && <div className={styles.empty2}>이동할 카메라가 없습니다.</div>}
                        {candidates.map((c) => (
                          <div key={c.id} className={styles.camItem}>
                            <StatusDot online={c.status !== 'offline'} />
                            <span className={styles.camName}>{c.name}</span>
                            <span className={styles.camHome}>{c.siteId ? sites.find((s) => s.id === c.siteId)?.name ?? '' : '미지정'}</span>
                            <button type="button" className={styles.rowBtn} onClick={() => { assignCameraToSite(c.id, st.id); toast.success('이동됨', `${c.name} → ${st.name}`); }}>이 사이트로 이동</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={styles.camList}>
                    {inSite.length === 0 && <div className={styles.empty2}>이 사이트에 배치된 카메라가 없습니다.</div>}
                    {inSite.map((c) => (
                      <div key={c.id} className={styles.camItem}>
                        <StatusDot online={c.status !== 'offline'} />
                        <span className={styles.camName}>{c.name}</span>
                        <button type="button" className={[styles.rowBtn, styles.rowBtnDanger].join(' ')} onClick={() => { assignCameraToSite(c.id, null); toast.info('미지정으로', c.name); }}>사이트에서 빼기</button>
                      </div>
                    ))}
                  </div>
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
    </div>
  );
}
