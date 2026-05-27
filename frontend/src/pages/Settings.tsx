// TODO: replace with fetch('/api/v1/settings')
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useMenuStore } from '@/store/menuStore';
import { ALL_ITEMS } from '@/components/layout/Sidebar';
import { useNavigate } from 'react-router-dom';
import page from './Page.module.css';
// Phase G — panel-2026-04-28 GPT 에셋 (Dashboard dark variant 무드보드, GP_HIER_P1_01 후순위 결정 자료)
import dashboardDarkMood from '@/assets/images/panel-2026-04-28/dashboard_dark_mockup_hint.png';

type Section = 'account' | 'video' | 'notification' | 'security' | 'system' | 'menu';
type ThemeChoice = 'light' | 'dark' | 'system';
type Resolution = '720p' | '1080p' | '4K';
type Codec = 'H.264' | 'H.265';
type UrgencyChannel = 'all' | 'selected' | 'email';
type ReceiveWindow = '24h' | 'office' | 'night';
type BackupCycle = 'hourly' | 'daily' | 'weekly';

/** 저장소 상태 반원 — 시안 재현 (78% 파란색) */
function StorageHalf({ percent }: { percent: number }) {
  // 반원 게이지: path를 호로 그려서 dashoffset으로 채움
  const r = 70;
  const c = Math.PI * r; // 반원 둘레
  const offset = c - (percent / 100) * c;
  return (
    <div className={page.storageHalf}>
      <svg viewBox="0 0 180 110" className={page.storageHalfSvg}>
        <path
          d={`M 20 100 A ${r} ${r} 0 0 1 160 100`}
          stroke="var(--color-surface-alt)"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M 20 100 A ${r} ${r} 0 0 1 160 100`}
          stroke="var(--color-accent)"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text
          x="90"
          y="92"
          textAnchor="middle"
          fontSize="26"
          fontWeight="700"
          fill="var(--color-text)"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {percent}%
        </text>
        <text x="90" y="106" textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">
          사용 중
        </text>
      </svg>
    </div>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      className={[page.switch, on ? page.switchOn : ''].filter(Boolean).join(' ')}
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      tabIndex={0}
    >
      <span className={page.switchThumb} />
    </div>
  );
}

export default function Settings() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const logout = useAuthStore((s) => s.logout);
  const nav = useNavigate();

  const hiddenPaths = useMenuStore((s) => s.hiddenPaths);
  const applyAll = useMenuStore((s) => s.applyAll);
  const [draftHidden, setDraftHidden] = useState<string[]>(() => hiddenPaths);

  const toggleDraft = (path: string) => {
    setDraftHidden((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const [section, setSection] = useState<Section>('account');
  const [retention, setRetention] = useState(90);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [sysName, setSysName] = useState('S1VaaS-HQ-Global-Server');
  const [sysAlert, setSysAlert] = useState(true);
  const [autoLogout, setAutoLogout] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyPush, setNotifyPush] = useState(true);
  const [mfa, setMfa] = useState(true);
  const [saved, setSaved] = useState(false);

  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(theme);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [codec, setCodec] = useState<Codec>('H.265');
  const [urgency, setUrgency] = useState<UrgencyChannel>('all');
  const [receive, setReceive] = useState<ReceiveWindow>('24h');
  const [backup, setBackup] = useState<BackupCycle>('daily');

  const applyThemeChoice = (choice: ThemeChoice) => {
    setThemeChoice(choice);
    if (choice === 'system') {
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(choice);
    }
  };

  useEffect(() => {
    if (themeChoice !== 'system') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = () => setTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [themeChoice, setTheme]);

  function handleSave() {
    if (section === 'menu') applyAll(draftHidden);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }
  function handleLogout() {
    logout();
    nav('/login', { replace: true });
  }

  const chipCls = (active: boolean) =>
    [page.chip, active ? page.chipActive : ''].filter(Boolean).join(' ');

  return (
    <div className={page.settingsPage}>
      <div className={page.settingsLeft}>
        <Tabs
          tabs={[
            { key: 'account', label: '계정 · 프로필' },
            { key: 'video', label: '영상 · 저장' },
            { key: 'notification', label: '알림' },
            { key: 'security', label: '보안' },
            { key: 'system', label: '시스템' },
            { key: 'menu', label: '메뉴 옵션' },
          ]}
          active={section}
          onChange={(k) => setSection(k as Section)}
        />

        <Card
          title={
            section === 'system'
              ? '시스템 정보 및 일반 설정'
              : section === 'account'
                ? '계정 · 프로필'
                : section === 'video'
                  ? '영상 · 저장'
                  : section === 'notification'
                    ? '알림 설정'
                    : section === 'menu'
                      ? '메뉴 표시 설정'
                      : '보안'
          }
        >
          {section === 'system' && (
            <>
              <Input
                label="시스템 명칭"
                value={sysName}
                onChange={(e) => setSysName(e.target.value)}
              />
              <div className={page.rowCols2}>
                <Select
                  label="영상 보관 기간 (일)"
                  value={String(retention)}
                  options={[
                    { value: '7', label: '7일 (단기)' },
                    { value: '30', label: '30일 (표준)' },
                    { value: '90', label: '90일 (장기)' },
                    { value: '180', label: '180일 (확장)' },
                  ]}
                  onChange={(v) => setRetention(Number(v))}
                />
                <Select
                  label="기본 녹화 해상도"
                  value={resolution}
                  options={[
                    { value: '720p', label: '720p HD' },
                    { value: '1080p', label: '1080p Full HD' },
                    { value: '4K', label: '4K UHD' },
                  ]}
                  onChange={(v) => setResolution(v as Resolution)}
                />
              </div>
              <div className={page.settingsRow}>
                <div>
                  <div className={page.settingsRowTitle}>시스템 긴급 알림</div>
                  <div className={page.settingsRowDesc}>
                    보안 이벤트 발생 시 관리자에게 즉시 푸시 알림을 발송합니다.
                  </div>
                </div>
                <Switch on={sysAlert} onToggle={() => setSysAlert(!sysAlert)} />
              </div>
              <div className={page.settingsRow}>
                <div>
                  <div className={page.settingsRowTitle}>자동 로그아웃 설정</div>
                  <div className={page.settingsRowDesc}>
                    30분 동안 활동이 없을 경우 세션을 종료합니다.
                  </div>
                </div>
                <Switch on={autoLogout} onToggle={() => setAutoLogout(!autoLogout)} />
              </div>
              <div className={page.settingsActions}>
                <button type="button" className={page.dangerLink} onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                  <span>로그아웃</span>
                </button>
                <div className={page.settingsActionsRight}>
                  <Button variant="secondary" size="sm">
                    취소
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    {saved ? '저장 완료' : '변경 사항 저장'}
                  </Button>
                </div>
              </div>
            </>
          )}
          {section === 'account' && (
            <>
              <div className={page.formRow}>
                <span className={page.formLabel}>조직명</span>
                <span>에스원 본사</span>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>담당자</span>
                <span>김관리 (admin@s1vaas.test)</span>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>타임존</span>
                <span>Asia/Seoul (UTC+9)</span>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>언어</span>
                <div className={page.chips}>
                  <button className={[page.chip, page.chipActive].join(' ')} type="button">
                    한국어
                  </button>
                  <button className={page.chip} type="button">
                    English
                  </button>
                </div>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>테마</span>
                <div className={page.chips}>
                  <button
                    className={chipCls(themeChoice === 'light')}
                    type="button"
                    onClick={() => applyThemeChoice('light')}
                  >
                    라이트
                  </button>
                  <button
                    className={chipCls(themeChoice === 'dark')}
                    type="button"
                    onClick={() => applyThemeChoice('dark')}
                  >
                    다크
                  </button>
                  <button
                    className={chipCls(themeChoice === 'system')}
                    type="button"
                    onClick={() => applyThemeChoice('system')}
                  >
                    시스템
                  </button>
                </div>
              </div>
            </>
          )}
          {section === 'video' && (
            <>
              <div className={page.formRow}>
                <span className={page.formLabel}>녹화 보존</span>
                <div className={page.chips}>
                  {[7, 14, 30, 60, 90].map((d) => (
                    <button
                      key={d}
                      className={chipCls(retention === d)}
                      onClick={() => setRetention(d)}
                      type="button"
                    >
                      {d}일
                    </button>
                  ))}
                </div>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>기본 해상도</span>
                <div className={page.chips}>
                  {(['720p', '1080p', '4K'] as Resolution[]).map((r) => (
                    <button
                      key={r}
                      className={chipCls(resolution === r)}
                      type="button"
                      onClick={() => setResolution(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>기본 코덱</span>
                <div className={page.chips}>
                  {(['H.264', 'H.265'] as Codec[]).map((c) => (
                    <button
                      key={c}
                      className={chipCls(codec === c)}
                      type="button"
                      onClick={() => setCodec(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>오버라이트</span>
                <Switch on={true} onToggle={() => {}} />
              </div>
            </>
          )}
          {section === 'notification' && (
            <>
              <div className={page.formRow}>
                <span className={page.formLabel}>이메일 알림</span>
                <Switch on={notifyEmail} onToggle={() => setNotifyEmail(!notifyEmail)} />
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>SMS 알림</span>
                <Switch on={notifySms} onToggle={() => setNotifySms(!notifySms)} />
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>푸시 알림</span>
                <Switch on={notifyPush} onToggle={() => setNotifyPush(!notifyPush)} />
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>긴급 이벤트</span>
                <div className={page.chips}>
                  <button className={chipCls(urgency === 'all')} type="button" onClick={() => setUrgency('all')}>
                    모든 채널
                  </button>
                  <button className={chipCls(urgency === 'selected')} type="button" onClick={() => setUrgency('selected')}>
                    선택 채널
                  </button>
                  <button className={chipCls(urgency === 'email')} type="button" onClick={() => setUrgency('email')}>
                    이메일만
                  </button>
                </div>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>수신 시간</span>
                <div className={page.chips}>
                  <button className={chipCls(receive === '24h')} type="button" onClick={() => setReceive('24h')}>
                    24시간
                  </button>
                  <button className={chipCls(receive === 'office')} type="button" onClick={() => setReceive('office')}>
                    업무시간
                  </button>
                  <button className={chipCls(receive === 'night')} type="button" onClick={() => setReceive('night')}>
                    야간만
                  </button>
                </div>
              </div>
            </>
          )}
          {section === 'menu' && (
            <>
              <p className={page.menuSectionDesc}>
                사이드바에 표시할 메뉴를 선택하세요. 저장 후 즉시 반영됩니다.
              </p>
              {ALL_ITEMS.map((item) => {
                const locked = item.path === '/settings';
                const visible = !draftHidden.includes(item.path);
                return (
                  <div key={item.path} className={page.menuItemRow}>
                    <div className={page.menuItemInfo}>
                      <span className={page.menuItemIcon}>{item.icon}</span>
                      <span className={page.menuItemLabel}>{item.label}</span>
                      {locked && (
                        <span className={page.menuItemLocked}>고정</span>
                      )}
                    </div>
                    <Switch
                      on={visible}
                      onToggle={() => !locked && toggleDraft(item.path)}
                    />
                  </div>
                );
              })}
              <div className={page.settingsActions}>
                <div />
                <div className={page.settingsActionsRight}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDraftHidden(hiddenPaths)}
                  >
                    취소
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    {saved ? '저장 완료' : '변경 사항 저장'}
                  </Button>
                </div>
              </div>
            </>
          )}
          {section === 'security' && (
            <>
              <div className={page.formRow}>
                <span className={page.formLabel}>2단계 인증</span>
                <Switch on={mfa} onToggle={() => setMfa(!mfa)} />
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>세션 타임아웃</span>
                <div className={page.chips}>
                  {[10, 30, 60, 120].map((m) => (
                    <button
                      key={m}
                      className={chipCls(sessionTimeout === m)}
                      onClick={() => setSessionTimeout(m)}
                      type="button"
                    >
                      {m}분
                    </button>
                  ))}
                </div>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>IP 화이트리스트</span>
                <Switch on={false} onToggle={() => {}} />
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>감사 로그 보존</span>
                <span>365일</span>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>백업 주기</span>
                <div className={page.chips}>
                  <button
                    className={chipCls(backup === 'hourly')}
                    type="button"
                    onClick={() => setBackup('hourly')}
                  >
                    매시간
                  </button>
                  <button
                    className={chipCls(backup === 'daily')}
                    type="button"
                    onClick={() => setBackup('daily')}
                  >
                    매일
                  </button>
                  <button
                    className={chipCls(backup === 'weekly')}
                    type="button"
                    onClick={() => setBackup('weekly')}
                  >
                    매주
                  </button>
                </div>
              </div>
              <div className={page.formRow}>
                <span className={page.formLabel}>라이선스</span>
                <Badge tone="success" dot>
                  Enterprise — 500 CAM
                </Badge>
              </div>
            </>
          )}
        </Card>

        <Card title="최근 보안 활동">
          <div className={page.securityList}>
            <div className={page.securityItem}>
              <span className={page.secDot} data-tone="accent" />
              <span className={page.securityMsg}>비밀번호 변경</span>
              <span className={page.securityTime}>2023-10-24 14:22</span>
            </div>
            <div className={page.securityItem}>
              <span className={page.secDot} />
              <span className={page.securityMsg}>새로운 기기 로그인 (Samsung Book 3)</span>
              <span className={page.securityTime}>2023-10-22 09:15</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== Right column ===== */}
      <aside className={page.settingsRight}>
        <Card
          title="저장소 상태"
          actions={
            <span className={page.infoIcon} aria-hidden>
              ⓘ
            </span>
          }
        >
          <StorageHalf percent={78} />
          <div className={page.storageLegend}>
            <div>
              <span className={page.storageLabel}>총 용량</span>
              <span className={page.storageVal}>12.0 TB</span>
            </div>
            <div>
              <span className={page.storageLabel}>사용 용량</span>
              <span className={page.storageVal}>9.36 TB</span>
            </div>
            <div>
              <span className={page.storageLabel}>잔여 용량</span>
              <span className={page.storageVal}>2.64 TB</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" block>
            데이터 클리닝 도구 실행
          </Button>
        </Card>

        <Card title="시스템 사양">
          <div className={page.specList}>
            <div className={page.specRow}>
              <span className={page.specLabel}>펌웨어 버전</span>
              <span className={page.specVal}>v2.4.12-enterprise (Stable)</span>
            </div>
            <div className={page.specRow}>
              <span className={page.specLabel}>OS 환경</span>
              <span className={page.specVal}>S1 Secure-Cloud Linux x64</span>
            </div>
            <div className={page.specRow}>
              <span className={page.specLabel}>최종 업데이트</span>
              <span className={page.specVal}>2023.10.15 03:00 (UTC+9)</span>
            </div>
            <div className={page.specRow}>
              <span className={page.specLabel}>서버 응답 속도</span>
              <span className={page.specVal}>
                <span className={page.onlineDotInline} /> 12ms (정상)
              </span>
            </div>
          </div>
        </Card>

        {/* Phase G — Dashboard dark variant 무드보드 (panel 2026-04-28 GPT 에셋) */}
        <Card title="Design Preview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <img
              src={dashboardDarkMood}
              alt="Dashboard dark variant 무드보드"
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
                display: 'block',
              }}
              loading="lazy"
            />
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              Phase A 패널 분석에서 Dashboard dark variant 무드보드 자료 (다음 라운드 후보)
            </div>
          </div>
        </Card>

        <div className={page.helpCard}>
          <div className={page.helpTitle}>도움이 필요하신가요?</div>
          <div className={page.helpDesc}>
            에스원 보안 관제 센터는 24시간 연중무휴로 운영됩니다.
          </div>
          <button type="button" className={page.helpBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2z" />
            </svg>
            <span>1588-3112 고객센터 연결</span>
          </button>
        </div>
      </aside>

      <footer className={page.settingsFoot}>
        <div className={page.certIcons}>
          {['ISMS', 'ISMS-P', 'CCM', 'ISO 27001', 'KISA'].map((c) => (
            <span key={c} className={page.certChip}>
              {c}
            </span>
          ))}
        </div>
        <div className={page.footerNote}>
          © 2023 S1 Corporation. All Rights Reserved. 본 시스템은 보안 관리자 권한을 가진
          사용자만 접근이 가능합니다.
        </div>
        <div className={page.footerLinks}>
          <a>개인정보처리방침</a>
          <a>서비스 이용약관</a>
          <a>기술지원센터</a>
        </div>
      </footer>
    </div>
  );
}
