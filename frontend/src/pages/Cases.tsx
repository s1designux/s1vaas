// TODO: replace with fetch('/api/v1/cases')
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { useCountUp } from '@/hooks/useCountUp';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, relativeTime } from '@/lib/time';
import { cases as seedCases } from '@/mock/cases';
import type {
  CaseAttachment,
  CaseComment,
  CasePriority,
  CaseStatus,
  SecurityCase,
} from '@/types/case';
import page from './Page.module.css';
import form from '@/components/ui/Form.module.css';
import css from './Cases.module.css';

const STATUS_LABEL: Record<CaseStatus, string> = {
  open: '신규',
  in_progress: '진행중',
  review: '검토',
  closed: '종결',
};

const STATUS_TONE: Record<CaseStatus, BadgeTone> = {
  open: 'info',
  in_progress: 'accent',
  review: 'warn',
  closed: 'neutral',
};

const PRIORITY_LABEL: Record<CasePriority, string> = {
  low: '낮음',
  mid: '보통',
  high: '높음',
};

const PRIORITY_TONE: Record<CasePriority, BadgeTone> = {
  low: 'neutral',
  mid: 'info',
  high: 'danger',
};

const STATUS_FLOW: CaseStatus[] = ['open', 'in_progress', 'review', 'closed'];

/** 첨부 썸네일 — seed 기반 결정론적 SVG */
function AttachThumb({ seed, kind }: { seed: string; kind: CaseAttachment['kind'] }) {
  const hash = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h;
  }, [seed]);
  const hue1 = hash % 360;
  const hue2 = (hash * 7) % 360;
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue1}, 30%, 22%)`} />
          <stop offset="100%" stopColor={`hsl(${hue2}, 28%, 12%)`} />
        </linearGradient>
      </defs>
      <rect width="160" height="90" fill={`url(#g-${seed})`} />
      {/* scanline */}
      <g opacity="0.18" style={{ color: 'var(--color-text-inverse)' }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={i} x1="0" x2="160" y1={i * 5 + 2} y2={i * 5 + 2} stroke="currentColor" strokeWidth="0.4" />
        ))}
      </g>
      {/* center icon */}
      <g transform="translate(80 45)" fill="none" stroke="currentColor" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-inverse)' }}>
        {kind === 'clip' && (
          <>
            <circle r="14" />
            <polygon points="-5,-7 8,0 -5,7" fill="currentColor" stroke="none" />
          </>
        )}
        {kind === 'snapshot' && (
          <>
            <rect x="-14" y="-10" width="28" height="20" rx="3" />
            <circle r="5" />
          </>
        )}
        {kind === 'document' && (
          <>
            <rect x="-10" y="-14" width="20" height="28" rx="2" />
            <line x1="-6" y1="-6" x2="6" y2="-6" />
            <line x1="-6" y1="0" x2="6" y2="0" />
            <line x1="-6" y1="6" x2="2" y2="6" />
          </>
        )}
      </g>
    </svg>
  );
}

const KIND_LABEL: Record<CaseAttachment['kind'], string> = {
  clip: 'CLIP',
  snapshot: 'SNAP',
  document: 'DOC',
};

function fmtDuration(sec?: number) {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function avatarChar(name: string) {
  return name.charAt(0) || '?';
}

interface KpiProps {
  label: string;
  value: number;
  unit?: string;
  meta?: string;
  variant?: 'accent' | 'success' | 'warn';
}

function CaseKpi({ label, value, unit, meta, variant = 'accent' }: KpiProps) {
  const v = useCountUp(value);
  const badgeCls =
    variant === 'success'
      ? css.kpiBadgeSuccess
      : variant === 'warn'
        ? css.kpiBadgeWarn
        : '';
  return (
    <div className={css.kpi}>
      <div className={css.kpiTopRow}>
        <div className={css.kpiLabel}>{label}</div>
        <div className={[css.kpiBadge, badgeCls].filter(Boolean).join(' ')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {variant === 'success' ? (
              <>
                <polyline points="20 6 9 17 4 12" />
              </>
            ) : variant === 'warn' ? (
              <>
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </>
            ) : (
              <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 10h18" />
                <path d="M9 4v4" />
                <path d="M15 4v4" />
              </>
            )}
          </svg>
        </div>
      </div>
      <div className={css.kpiValue}>
        {v.toLocaleString()}
        {unit && <span className={css.kpiUnit}>{unit}</span>}
      </div>
      {meta && <div className={css.kpiMeta}>{meta}</div>}
    </div>
  );
}

export default function Cases() {
  const toast = useToast();

  // local mock-backed state (no shared store)
  const [items, setItems] = useState<SecurityCase[]>(seedCases);
  const [selectedId, setSelectedId] = useState<string | null>(seedCases[0]?.id ?? null);

  // filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | 'all'>('all');

  // new case drawer
  const [newOpen, setNewOpen] = useState(false);
  const [nTitle, setNTitle] = useState('');
  const [nPriority, setNPriority] = useState<CasePriority>('mid');
  const [nDescription, setNDescription] = useState('');
  const [nTags, setNTags] = useState<string[]>([]);
  const [nTagInput, setNTagInput] = useState('');
  const [nAlertIds, setNAlertIds] = useState<string[]>([]);
  const [nAlertInput, setNAlertInput] = useState('');

  // comment input
  const [commentText, setCommentText] = useState('');
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // KPI calc
  const kpiInProgress = useMemo(
    () => items.filter((c) => c.status !== 'closed').length,
    [items],
  );
  const kpiClosed = useMemo(
    () => items.filter((c) => c.status === 'closed').length,
    [items],
  );
  const kpiAvgDays = useMemo(() => {
    const closed = items.filter((c) => c.status === 'closed');
    if (closed.length === 0) return 0;
    const total = closed.reduce((acc, c) => {
      const a = Date.parse(c.createdAt);
      const b = Date.parse(c.updatedAt);
      if (Number.isNaN(a) || Number.isNaN(b)) return acc;
      return acc + Math.max(0, (b - a) / (24 * 60 * 60 * 1000));
    }, 0);
    return Math.round(total / closed.length);
  }, [items]);

  // filtering
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      if (q.length > 0) {
        const hay = `${c.code} ${c.title} ${c.owner} ${c.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, statusFilter, priorityFilter]);

  // selected case
  const selected = useMemo(
    () => items.find((c) => c.id === selectedId) ?? null,
    [items, selectedId],
  );

  // ensure selection stays valid as filters shift
  useEffect(() => {
    if (filtered.length === 0) return;
    if (!selected || !filtered.some((c) => c.id === selected.id)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selected]);

  /* ---------- handlers ---------- */
  const openNewCase = () => {
    setNTitle('');
    setNPriority('mid');
    setNDescription('');
    setNTags([]);
    setNTagInput('');
    setNAlertIds([]);
    setNAlertInput('');
    setNewOpen(true);
  };

  const submitNewCase = () => {
    const title = nTitle.trim();
    if (!title) {
      toast.warn('제목을 입력해 주세요.');
      return;
    }
    const now = new Date();
    const idSuffix = String(items.length + 1).padStart(3, '0');
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const newCase: SecurityCase = {
      id: `cs-new-${Date.now()}`,
      code: `C-${yyyy}-${mm}${dd}-${idSuffix}`,
      title,
      status: 'open',
      priority: nPriority,
      owner: '관제센터',
      tags: nTags.length > 0 ? nTags : ['신규'],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      description: nDescription.trim() || '신규 케이스로 등록되었습니다. 상세 내용을 추가해 주세요.',
      attachments: [],
      comments: nAlertIds.length > 0
        ? [
            {
              id: `cm-${Date.now()}`,
              at: now.toISOString(),
              by: '관제센터',
              text: `관련 알림 ${nAlertIds.join(', ')} 와 연결되었습니다.`,
            },
          ]
        : [],
    };
    setItems((prev) => [newCase, ...prev]);
    setSelectedId(newCase.id);
    setNewOpen(false);
    toast.success('케이스가 생성되었습니다.', newCase.code);
  };

  const addTag = () => {
    const t = nTagInput.trim();
    if (!t) return;
    if (!nTags.includes(t)) setNTags((prev) => [...prev, t]);
    setNTagInput('');
  };

  const removeTag = (t: string) => setNTags((prev) => prev.filter((x) => x !== t));

  const addAlertId = () => {
    const t = nAlertInput.trim();
    if (!t) return;
    if (!nAlertIds.includes(t)) setNAlertIds((prev) => [...prev, t]);
    setNAlertInput('');
  };

  const removeAlertId = (t: string) => setNAlertIds((prev) => prev.filter((x) => x !== t));

  const submitComment = () => {
    if (!selected) return;
    const text = commentText.trim();
    if (!text) return;
    const newComment: CaseComment = {
      id: `cm-${Date.now()}`,
      at: new Date().toISOString(),
      by: '관제센터',
      text,
    };
    setItems((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? { ...c, comments: [...c.comments, newComment], updatedAt: newComment.at }
          : c,
      ),
    );
    setCommentText('');
    toast.success('코멘트가 추가되었습니다.');
  };

  const onCommentKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  const changeStatus = (next: CaseStatus) => {
    if (!selected) return;
    if (next === selected.status) return;
    setItems((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? { ...c, status: next, updatedAt: new Date().toISOString() }
          : c,
      ),
    );
    toast.success('상태가 변경되었습니다.', `${STATUS_LABEL[selected.status]} → ${STATUS_LABEL[next]}`);
  };

  const onBulkExport = () => {
    toast.info('보고서 일괄 다운', `${items.length}건의 케이스 PDF 생성을 시작합니다.`);
  };

  const onPdfReport = () => {
    if (!selected) return;
    toast.info('PDF 보고서 생성', `${selected.code} 보고서를 생성합니다.`);
  };

  const onCreateShare = () => {
    if (!selected) return;
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    setItems((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              shareLink: {
                url: `https://share.s1vaas.com/c/${Math.random().toString(16).slice(2, 10)}`,
                expiresAt: expires,
              },
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    );
    toast.success('공유 링크가 생성되었습니다.', '7일 후 자동 만료');
  };

  /* ---------- render ---------- */
  return (
    <div className={page.page}>
      <div className={page.header}>
        <div className={page.actions}>
          <Button variant="secondary" size="sm" onClick={onBulkExport}>
            보고서 일괄 다운
          </Button>
          <Button variant="primary" size="sm" onClick={openNewCase}>
            + 새 케이스
          </Button>
        </div>
      </div>

      <div className={css.kpiRow3}>
        <CaseKpi
          label="진행 중"
          value={kpiInProgress}
          unit="건"
          meta={`전체 ${items.length}건 중`}
          variant="accent"
        />
        <CaseKpi
          label="종결됨"
          value={kpiClosed}
          unit="건"
          meta={`종결률 ${items.length > 0 ? Math.round((kpiClosed / items.length) * 100) : 0}%`}
          variant="success"
        />
        <CaseKpi
          label="평균 처리일"
          value={kpiAvgDays}
          unit="일"
          meta="종결 케이스 기준"
          variant="warn"
        />
      </div>

      <div className={css.layout}>
        {/* ---------- Left ---------- */}
        <div className={css.leftCol}>
          <div className={css.searchBar}>
            <input
              className={css.searchInput}
              type="search"
              placeholder="케이스 코드·제목·담당자·태그 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className={css.filterRow}>
            <span className={css.filterLabel}>상태</span>
            <div className={css.chipRow}>
              <button
                type="button"
                className={[css.chip, statusFilter === 'all' ? css.chipActive : ''].join(' ')}
                onClick={() => setStatusFilter('all')}
              >
                전체
              </button>
              {(STATUS_FLOW as CaseStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={[css.chip, statusFilter === s ? css.chipActive : ''].join(' ')}
                  onClick={() => setStatusFilter(s)}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <span className={css.filterLabel} style={{ marginTop: 'var(--space-2)' }}>
              우선순위
            </span>
            <div className={css.chipRow}>
              <button
                type="button"
                className={[css.chip, priorityFilter === 'all' ? css.chipActive : ''].join(' ')}
                onClick={() => setPriorityFilter('all')}
              >
                전체
              </button>
              {(['high', 'mid', 'low'] as CasePriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={[css.chip, priorityFilter === p ? css.chipActive : ''].join(' ')}
                  onClick={() => setPriorityFilter(p)}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <div className={css.caseList}>
            {filtered.length === 0 ? (
              <div className={css.emptyList}>일치하는 케이스가 없습니다.</div>
            ) : (
              filtered.map((c) => {
                const isActive = c.id === selected?.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={[css.caseItem, isActive ? css.caseItemActive : ''].join(' ')}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className={css.caseCode}>{c.code}</div>
                    <div className={css.caseTitle}>{c.title}</div>
                    <div className={css.caseMetaLine}>
                      <Badge tone={STATUS_TONE[c.status]} dot>
                        {STATUS_LABEL[c.status]}
                      </Badge>
                      <Badge tone={PRIORITY_TONE[c.priority]}>{PRIORITY_LABEL[c.priority]}</Badge>
                      <span className={css.caseMetaSep}>·</span>
                      <span>{c.owner}</span>
                      <span className={css.caseMetaSep}>·</span>
                      <span>{relativeTime(c.updatedAt)}</span>
                    </div>
                    {c.tags.length > 0 && (
                      <div className={css.caseTagRow}>
                        {c.tags.slice(0, 3).map((t) => (
                          <span key={t} className={css.caseTag}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ---------- Right ---------- */}
        <div className={css.detail}>
          {!selected ? (
            <div className={css.detailEmpty}>좌측 리스트에서 케이스를 선택하세요.</div>
          ) : (
            <>
              <div className={css.detailHead}>
                <div className={css.detailHeadTop}>
                  <div className={css.detailCode}>{selected.code}</div>
                  <div className={css.detailTitle}>{selected.title}</div>
                  <div className={css.detailBadges}>
                    <Badge tone={STATUS_TONE[selected.status]} dot>
                      {STATUS_LABEL[selected.status]}
                    </Badge>
                    <Badge tone={PRIORITY_TONE[selected.priority]}>
                      우선순위 · {PRIORITY_LABEL[selected.priority]}
                    </Badge>
                    {selected.tags.map((t) => (
                      <Badge key={t} tone="neutral">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className={css.detailMetaGrid}>
                  <div className={css.metaItem}>
                    <span className={css.metaLabel}>담당자</span>
                    <span className={css.metaVal}>{selected.owner}</span>
                  </div>
                  <div className={css.metaItem}>
                    <span className={css.metaLabel}>등록 시각</span>
                    <span className={css.metaValMono}>{formatDateTime(selected.createdAt)}</span>
                  </div>
                  <div className={css.metaItem}>
                    <span className={css.metaLabel}>마지막 업데이트</span>
                    <span className={css.metaValMono}>{relativeTime(selected.updatedAt)}</span>
                  </div>
                  {selected.shareLink && (
                    <div className={css.metaItem}>
                      <span className={css.metaLabel}>공유 링크 만료</span>
                      <span className={css.metaValMono}>
                        {formatDateTime(selected.shareLink.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={css.detailBody}>
                <section>
                  <div className={css.sectionHead}>
                    <span className={css.sectionTitle}>설명</span>
                  </div>
                  <div className={css.descCard}>{selected.description}</div>
                </section>

                <section>
                  <div className={css.sectionHead}>
                    <span className={css.sectionTitle}>첨부 자료</span>
                    <span className={css.sectionCount}>{selected.attachments.length}건</span>
                  </div>
                  {selected.attachments.length === 0 ? (
                    <div className={css.descCard} style={{ color: 'var(--color-text-muted)' }}>
                      첨부된 자료가 없습니다.
                    </div>
                  ) : (
                    <div className={css.attachGrid}>
                      {selected.attachments.map((a) => {
                        const dur = fmtDuration(a.durationSec);
                        return (
                          <div key={a.id} className={css.attachCard}>
                            <div className={css.attachThumb}>
                              <AttachThumb seed={a.thumbSeed} kind={a.kind} />
                              <span className={css.attachKind}>{KIND_LABEL[a.kind]}</span>
                              {dur && <span className={css.attachDuration}>{dur}</span>}
                            </div>
                            <div className={css.attachBody}>
                              <span className={css.attachCam}>{a.cameraName}</span>
                              <span className={css.attachSite}>{a.siteName}</span>
                              <span className={css.attachTime}>{formatDateTime(a.capturedAt)}</span>
                              {a.note && <span className={css.attachNote}>{a.note}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section>
                  <div className={css.sectionHead}>
                    <span className={css.sectionTitle}>코멘트</span>
                    <span className={css.sectionCount}>{selected.comments.length}건</span>
                  </div>
                  <div className={css.thread}>
                    {selected.comments.length === 0 ? (
                      <div className={css.descCard} style={{ color: 'var(--color-text-muted)' }}>
                        아직 코멘트가 없습니다.
                      </div>
                    ) : (
                      selected.comments.map((cm) => (
                        <div key={cm.id} className={css.commentItem}>
                          <span className={css.commentAvatar}>{avatarChar(cm.by)}</span>
                          <div className={css.commentBody}>
                            <div className={css.commentHead}>
                              <span className={css.commentBy}>{cm.by}</span>
                              <span>·</span>
                              <span>{relativeTime(cm.at)}</span>
                            </div>
                            <div className={css.commentText}>{cm.text}</div>
                          </div>
                        </div>
                      ))
                    )}

                    <div className={css.commentInputRow}>
                      <textarea
                        ref={commentRef}
                        className={css.commentTextarea}
                        placeholder="코멘트를 입력하세요. (Enter 로 등록 · Shift+Enter 줄바꿈)"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={onCommentKey}
                      />
                      <div className={css.commentSubmit}>
                        <Button variant="primary" size="sm" onClick={submitComment}>
                          코멘트 추가
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className={css.detailFooter}>
                <div className={css.footActions}>
                  <Button variant="secondary" size="sm" onClick={onPdfReport}>
                    PDF 보고서 생성
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onCreateShare}>
                    공유 링크 만들기
                  </Button>
                </div>
                <div className={css.statusGroup}>
                  <span className={css.statusLabel}>상태</span>
                  <select
                    className={css.statusSelect}
                    value={selected.status}
                    onChange={(e) => changeStatus(e.target.value as CaseStatus)}
                  >
                    {STATUS_FLOW.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------- New Case Drawer ---------- */}
      <Drawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="새 케이스"
        subtitle="보안 사건을 케이스로 등록합니다"
        width={520}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setNewOpen(false)}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={submitNewCase}>
              저장
            </Button>
          </>
        }
      >
        <div className={form.field}>
          <label className={form.label}>제목</label>
          <div className={form.inputWrap}>
            <input
              className={form.input}
              value={nTitle}
              onChange={(e) => setNTitle(e.target.value)}
              placeholder="예: 강남본점 후문 침입 의심 (4/30)"
            />
          </div>
        </div>

        <div className={form.field}>
          <label className={form.label}>우선순위</label>
          <div className={form.inputWrap}>
            <select
              className={form.select}
              value={nPriority}
              onChange={(e) => setNPriority(e.target.value as CasePriority)}
            >
              {(['high', 'mid', 'low'] as CasePriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={form.field}>
          <label className={form.label}>태그</label>
          <div className={css.tagInputWrap}>
            {nTags.map((t) => (
              <span key={t} className={css.tagPill}>
                #{t}
                <span
                  className={css.tagPillX}
                  role="button"
                  tabIndex={0}
                  onClick={() => removeTag(t)}
                >
                  ×
                </span>
              </span>
            ))}
            <input
              className={css.tagInput}
              value={nTagInput}
              onChange={(e) => setNTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="태그 입력 후 Enter"
            />
          </div>
          <span className={css.drawerNote}>예: 야간 · 외부인 · 후속조치필요</span>
        </div>

        <div className={form.field}>
          <label className={form.label}>관련 알림 ID</label>
          <div className={css.tagInputWrap}>
            {nAlertIds.map((t) => (
              <span key={t} className={css.tagPill}>
                {t}
                <span
                  className={css.tagPillX}
                  role="button"
                  tabIndex={0}
                  onClick={() => removeAlertId(t)}
                >
                  ×
                </span>
              </span>
            ))}
            <input
              className={css.tagInput}
              value={nAlertInput}
              onChange={(e) => setNAlertInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addAlertId();
                }
              }}
              placeholder="A-2026-0421-... Enter"
            />
          </div>
        </div>

        <div className={form.field}>
          <label className={form.label}>설명</label>
          <div className={form.inputWrap}>
            <textarea
              className={form.textarea}
              value={nDescription}
              onChange={(e) => setNDescription(e.target.value)}
              rows={5}
              placeholder="사건의 발생 시각, 장소, 상황, 1차 조치 내용 등을 기록합니다."
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
