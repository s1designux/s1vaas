// TODO: replace with fetch('/api/v1/users')
import { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import UserLog from './UserLog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Checkbox } from '@/components/ui/Checkbox';
import { useCountUp } from '@/hooks/useCountUp';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/time';
import type { AppUser, UserRole, UserStatus } from '@/types';
import page from './Page.module.css';
import form from '@/components/ui/Form.module.css';

const ROLE_LABEL: Record<UserRole, string> = {
  admin: '관리자',
  operator: '운영자',
  monitor: '모니터요원',
  inspector: '점검자',
  readonly: '읽기전용',
};

const ROLE_TONE: Record<UserRole, BadgeTone> = {
  admin: 'accent',
  operator: 'info',
  monitor: 'success',
  inspector: 'warn',
  readonly: 'neutral',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  active: '활성',
  invited: '초대됨',
  disabled: '비활성',
};

const STATUS_TONE: Record<UserStatus, BadgeTone> = {
  active: 'success',
  invited: 'info',
  disabled: 'neutral',
};

const PERMISSIONS: { key: string; label: string }[] = [
  { key: 'view', label: '영상 조회' },
  { key: 'record', label: '녹화 · 스냅샷' },
  { key: 'config', label: '카메라 설정' },
  { key: 'site', label: '사이트 관리' },
  { key: 'user', label: '사용자 관리' },
  { key: 'audit', label: '감사 로그' },
];

const PERM_MATRIX: Record<UserRole, Record<string, boolean>> = {
  admin:     { view: true,  record: true,  config: true,  site: true,  user: true,  audit: true  },
  operator:  { view: true,  record: true,  config: true,  site: false, user: false, audit: true  },
  monitor:   { view: true,  record: true,  config: false, site: false, user: false, audit: false },
  inspector: { view: true,  record: false, config: true,  site: false, user: false, audit: true  },
  readonly:  { view: true,  record: false, config: false, site: false, user: false, audit: false },
};

/** 페이지 상단 breadcrumb */
function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav className={page.breadcrumb} aria-label="breadcrumb">
      {items.map((it, i) => (
        <span key={i} className={page.breadcrumbItem}>
          {i > 0 && <span className={page.breadcrumbSep}>›</span>}
          <span className={i === items.length - 1 ? page.breadcrumbLast : undefined}>{it}</span>
        </span>
      ))}
    </nav>
  );
}

function UserKpi({
  label,
  value,
  meta,
  variant,
}: {
  label: string;
  value: number;
  meta?: string;
  variant: 'total' | 'active';
}) {
  const v = useCountUp(value);
  return (
    <div className={page.userKpi}>
      <div className={page.kpiRowTop}>
        <div className={page.kpiLabel}>{label}</div>
        <div className={[page.kpiIconBadge, variant === 'total' ? page.kpiIconBadge_site : page.kpiIconBadge_uptime].join(' ')}>
          {variant === 'total' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          )}
        </div>
      </div>
      <div className={`${page.kpiValueLg} tabular`}>
        {v.toLocaleString()}
        <span className={page.kpiUnit}>명</span>
      </div>
      {meta && <div className={page.kpiMeta}>{meta}</div>}
    </div>
  );
}

type UserTab = 'permission' | 'log';

export default function User() {
  const [tab, setTab] = useState<UserTab>('permission');

  const users = useDataStore((s) => s.users);
  const sites = useDataStore((s) => s.sites);
  const inviteUser = useDataStore((s) => s.inviteUser);
  const updateUser = useDataStore((s) => s.updateUser);
  const removeUser = useDataStore((s) => s.removeUser);
  const toast = useToast();
  const [filter, setFilter] = useState<UserRole | 'all'>('all');

  // invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState<UserRole>('readonly');
  const [invSites, setInvSites] = useState<string[]>([]);
  const [invMessage, setInvMessage] = useState('');

  // edit drawer
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('readonly');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [editMfa, setEditMfa] = useState(false);
  const [editSiteIds, setEditSiteIds] = useState<string[]>([]);

  // delete confirm
  const [deleteUser, setDeleteUser] = useState<AppUser | null>(null);

  // permission matrix visibility
  const [permOpen, setPermOpen] = useState(false);

  const filtered = useMemo(
    () => (filter === 'all' ? users : users.filter((u) => u.role === filter)),
    [users, filter],
  );

  const activeIn30d = useMemo(() => {
    const thirty = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return users.filter((u) => u.lastLoginAt && Date.parse(u.lastLoginAt) >= thirty).length;
  }, [users]);

  const openInvite = () => {
    setInvEmail('');
    setInvRole('readonly');
    setInvSites([]);
    setInvMessage('');
    setInviteOpen(true);
  };

  const sendInvite = () => {
    const trimmed = invEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast.warn('올바른 이메일을 입력해 주세요.');
      return;
    }
    inviteUser({ email: trimmed, role: invRole, siteIds: invSites });
    toast.success('초대 메일 발송', `${trimmed} 에게 ${ROLE_LABEL[invRole]} 권한으로 초대가 발송되었습니다.`);
    setInviteOpen(false);
  };

  const openEdit = (u: AppUser) => {
    setEditUser(u);
    setEditName(u.displayName);
    setEditRole(u.role);
    setEditStatus(u.status ?? (u.lastLoginAt ? 'active' : 'invited'));
    setEditMfa(u.mfaEnabled ?? false);
    setEditSiteIds(u.siteIds ?? []);
  };

  const saveEdit = () => {
    if (!editUser) return;
    updateUser(editUser.id, {
      displayName: editName.trim() || editUser.displayName,
      role: editRole,
      status: editStatus,
      mfaEnabled: editMfa,
      siteIds: editSiteIds,
    });
    toast.success('저장되었습니다', `${editName} 사용자 정보가 업데이트되었습니다.`);
    setEditUser(null);
  };

  const resetMfa = () => {
    if (!editUser) return;
    setEditMfa(false);
    toast.info('2FA 초기화', `${editUser.displayName} 의 2차 인증이 초기화되었습니다.`);
  };

  const confirmDelete = () => {
    if (!deleteUser) return;
    const name = deleteUser.displayName;
    removeUser(deleteUser.id);
    toast.danger('사용자 삭제', `${name} 사용자가 제거되었습니다.`);
    setDeleteUser(null);
  };

  const toggleInvSite = (id: string) => {
    setInvSites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleEditSite = (id: string) => {
    setEditSiteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div
      className={page.page}
      style={tab === 'log' ? { height: '100%', overflow: 'hidden' } : undefined}
    >
      {/* 2-depth tab chips */}
      <div className={page.chips}>
        <button
          type="button"
          className={[page.chip, tab === 'permission' ? page.chipActive : ''].filter(Boolean).join(' ')}
          onClick={() => setTab('permission')}
        >
          사용자 권한
        </button>
        <button
          type="button"
          className={[page.chip, tab === 'log' ? page.chipActive : ''].filter(Boolean).join(' ')}
          onClick={() => setTab('log')}
        >
          사용자 로그
        </button>
      </div>

      {/* ── 사용자 로그 탭 ── */}
      {tab === 'log' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <UserLog />
        </div>
      )}

      {/* ── 사용자 권한 탭 ── */}
      {tab === 'permission' && <>
      <Breadcrumb items={['에스원 클라우드', '사용자 관리']} />
      <div className={page.header}>
        <div className={page.actions}>
          <Button variant="primary" size="sm" onClick={openInvite}>
            + 사용자 추가
          </Button>
        </div>
      </div>

      <div className={page.userKpiRow}>
        <UserKpi
          label="총 사용자"
          value={users.length}
          meta="지난 달 대비 +0%"
          variant="total"
        />
        <UserKpi
          label="최근 30일 활성"
          value={activeIn30d}
          meta={`활성률 ${Math.round((activeIn30d / Math.max(1, users.length)) * 100)}%`}
          variant="active"
        />
        <button
          type="button"
          className={page.permShortcut}
          onClick={() => setPermOpen((v) => !v)}
          aria-expanded={permOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l8 4v5c0 5-4 9-8 10-4-1-8-5-8-10V7z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>권한 그룹 설정 바로가기</span>
        </button>
      </div>

      {permOpen && (
        <Card title="역할 × 권한 매트릭스">
          <div className={page.roleCards}>
            {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
              <div
                key={r}
                className={page.roleCard}
                onClick={() => setFilter(r)}
                style={filter === r ? { borderColor: 'var(--color-accent)' } : undefined}
              >
                <span className={page.roleCardTitle}>{ROLE_LABEL[r]}</span>
                <span className={page.roleCardCount}>
                  {users.filter((u) => u.role === r).length}명
                </span>
              </div>
            ))}
            <div
              className={page.roleCard}
              onClick={() => setFilter('all')}
              style={filter === 'all' ? { borderColor: 'var(--color-accent)' } : undefined}
            >
              <span className={page.roleCardTitle}>전체 보기</span>
              <span className={page.roleCardCount}>{users.length}명</span>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-4)', overflowX: 'auto' }}>
            <table className={page.permMatrix}>
              <thead>
                <tr>
                  <th>권한</th>
                  {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                    <th key={r}>{ROLE_LABEL[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p) => (
                  <tr key={p.key}>
                    <td>{p.label}</td>
                    {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                      <td key={r}>
                        {PERM_MATRIX[r][p.key] ? (
                          <span className={page.permYes}>✓</span>
                        ) : (
                          <span className={page.permNo}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className={page.userTableCard}>
        <table className={page.userTable}>
          <thead>
            <tr>
              <th>이름</th>
              <th>역할</th>
              <th>이메일</th>
              <th>최근 접속</th>
              <th style={{ width: 100, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const st: UserStatus = u.status ?? (u.lastLoginAt ? 'active' : 'invited');
              return (
                <tr key={u.id}>
                  <td>
                    <div className={page.userMeta}>
                      <span className={page.userAvatar}>{u.displayName.charAt(0)}</span>
                      <div className={page.userInfo}>
                        <span className={page.userName}>{u.displayName}</span>
                        <span className={page.userEmail}>
                          <Badge tone={STATUS_TONE[st]} dot>
                            {STATUS_LABEL[st]}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={ROLE_TONE[u.role]} dot={false}>
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                    {formatDateTime(u.lastLoginAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={page.userActions}>
                      <button
                        className={page.iconBtn}
                        type="button"
                        onClick={() => openEdit(u)}
                        aria-label="편집"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
                      <button
                        className={[page.iconBtn, page.iconBtnDanger].join(' ')}
                        type="button"
                        onClick={() => setDeleteUser(u)}
                        aria-label="삭제"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={page.tableFoot}>
          <span className={page.tableFootInfo}>
            총 {users.length}명 · 최근 30일 활성 {activeIn30d}명
          </span>
          <div className={page.pager}>
            <button type="button" className={page.pagerBtn} aria-label="이전">
              ‹
            </button>
            <button type="button" className={[page.pagerBtn, page.pagerActive].join(' ')}>
              1
            </button>
            <button type="button" className={page.pagerBtn} aria-label="다음">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="사용자 초대"
        subtitle="이메일로 초대 링크를 보냅니다."
        width={480}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setInviteOpen(false)}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={sendInvite}>
              전송
            </Button>
          </>
        }
      >
        <div className={form.field}>
          <label className={form.label}>이메일</label>
          <div className={form.inputWrap}>
            <input
              className={form.input}
              type="email"
              value={invEmail}
              onChange={(e) => setInvEmail(e.target.value)}
              placeholder="user@company.com"
            />
          </div>
        </div>
        <div className={form.field}>
          <label className={form.label}>역할</label>
          <div className={form.inputWrap}>
            <select
              className={form.select}
              value={invRole}
              onChange={(e) => setInvRole(e.target.value as UserRole)}
            >
              {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={form.field}>
          <label className={form.label}>접근 사이트</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '4px' }}>
            {sites.map((s) => (
              <Checkbox
                key={s.id}
                checked={invSites.includes(s.id)}
                onChange={() => toggleInvSite(s.id)}
              >
                {s.name}
              </Checkbox>
            ))}
          </div>
        </div>
        <div className={form.field}>
          <label className={form.label}>환영 메시지 (선택)</label>
          <div className={form.inputWrap}>
            <textarea
              className={form.textarea}
              value={invMessage}
              onChange={(e) => setInvMessage(e.target.value)}
              placeholder="초대 메일에 포함될 메시지"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Drawer */}
      <Drawer
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="사용자 편집"
        subtitle={editUser?.email}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditUser(null)}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={saveEdit}>
              저장
            </Button>
          </>
        }
      >
        {editUser && (
          <>
            <div className={form.sectionCaption}>기본 정보</div>
            <div className={form.field}>
              <label className={form.label}>이름</label>
              <div className={form.inputWrap}>
                <input
                  className={form.input}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
            </div>
            <div className={form.field}>
              <label className={form.label}>이메일 (읽기 전용)</label>
              <div className={form.inputWrap}>
                <input className={form.input} value={editUser.email} disabled readOnly />
              </div>
            </div>
            <div className={form.rowCols2}>
              <div className={form.field}>
                <label className={form.label}>역할</label>
                <div className={form.inputWrap}>
                  <select
                    className={form.select}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                  >
                    {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={form.field}>
                <label className={form.label}>상태</label>
                <div className={form.inputWrap}>
                  <select
                    className={form.select}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                  >
                    {(Object.keys(STATUS_LABEL) as UserStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABEL[st]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={form.sectionCaption}>접근 사이트</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '4px' }}>
              {sites.map((s) => (
                <Checkbox
                  key={s.id}
                  checked={editSiteIds.includes(s.id)}
                  onChange={() => toggleEditSite(s.id)}
                >
                  {s.name}
                </Checkbox>
              ))}
            </div>

            <div className={form.sectionCaption}>보안</div>
            <div className={form.kv}>
              <span className={form.kvLabel}>2차 인증(2FA)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Badge tone={editMfa ? 'success' : 'neutral'} dot>
                  {editMfa ? '활성' : '비활성'}
                </Badge>
                <Button variant="secondary" size="sm" onClick={() => setEditMfa(!editMfa)}>
                  {editMfa ? '끄기' : '켜기'}
                </Button>
                <Button variant="secondary" size="sm" onClick={resetMfa}>
                  초기화
                </Button>
              </div>
            </div>
            <div className={form.kv}>
              <span className={form.kvLabel}>최근 로그인</span>
              <span className={form.kvVal}>{formatDateTime(editUser.lastLoginAt)}</span>
            </div>
          </>
        )}
      </Drawer>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="사용자 삭제"
        width={400}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteUser(null)}>
              취소
            </Button>
            <Button variant="secondary" size="sm" onClick={confirmDelete}>
              삭제
            </Button>
          </>
        }
      >
        {deleteUser && (
          <div style={{ color: 'var(--color-text)', lineHeight: 1.6 }}>
            <strong>{deleteUser.displayName}</strong> 사용자를 삭제합니까?
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 8 }}>
              계정이 영구 제거되며 복구할 수 없습니다.
            </div>
          </div>
        )}
      </Modal>
      </>}
    </div>
  );
}
