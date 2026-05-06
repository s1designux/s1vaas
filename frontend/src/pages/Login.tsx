// TODO: replace with fetch('/api/v1/auth/login', { method: 'POST', body: ... })
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './Login.module.css';
// Phase G — panel-2026-04-28 GPT 에셋 (Login 좌패널 절제 hero, BRAND_P2_01 톤 다운 후 메인 비주얼)
import loginHero from '@/assets/images/panel-2026-04-28/login_left_hero_v2.png';

const CERTS = ['ISMS', 'ISMS-P', 'CCM', 'ISO 27001', 'KISA'];

/** 육각형 aperture — 시안의 중앙 로고 (outline + dashed inner + center dot) */
function HexMark({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M60 6 L107 33 L107 87 L60 114 L13 87 L13 33 Z" strokeWidth="2" opacity="0.9" />
      <path
        d="M60 28 L88 44 L88 76 L60 92 L32 76 L32 44 Z"
        strokeWidth="1.5"
        strokeDasharray="5 3"
        opacity="0.7"
      />
      <circle cx="60" cy="60" r="8" strokeWidth="2" />
    </svg>
  );
}

// PROD 빌드에서는 데모 자격증명을 자동 채우거나 노출하지 않는다 (CL_A11Y_P1_01).
const IS_DEV = import.meta.env.DEV;

export default function Login() {
  const [email, setEmail] = useState(IS_DEV ? 'admin@s1vaas.test' : '');
  const [pw, setPw] = useState(IS_DEV ? 's1vaas' : '');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const login = useAuthStore((s) => s.login);
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const ok = await login(email, pw);
      if (ok) nav('/dashboard', { replace: true });
      else setError('로그인 정보를 확인해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.brand}>
        {/* Phase G — GPT hero 이미지 (Samsung S1 Seocho Tower 톤, blue hour). 점 패턴/글로우 위에 깔린다. */}
        <div
          className={styles.heroImg}
          style={{ backgroundImage: `url(${loginHero})` }}
          aria-hidden
        />
        {/* 점 패턴 배경 */}
        <div className={styles.dotsBg} aria-hidden />
        <div className={styles.glow} aria-hidden />
        <div className={styles.brandCenter}>
          <div className={styles.hexWrap}>
            <HexMark size={128} />
          </div>
          <div className={styles.brandTitle}>에스원 클라우드</div>
          <div className={styles.brandSub}>S1 CLOUD · VSAAS</div>
        </div>
        <div className={styles.certs}>
          {CERTS.map((c, i) => (
            <span key={c} className={styles.certChip} style={{ animationDelay: `${i * 60}ms` }}>
              {c}
            </span>
          ))}
        </div>
      </aside>

      <section className={styles.form}>
        <div className={styles.themeTopRight}>
          <ThemeToggle />
        </div>
        <form className={styles.formInner} onSubmit={onSubmit}>
          <div className={styles.formTitle}>
            <h2>관리자 로그인</h2>
            <p>에스원 클라우드 영상관제 시스템에 접속합니다</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              아이디
            </label>
            <div className={styles.inputWrap}>
              <svg
                className={styles.inputIcon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 7 9-7" />
              </svg>
              <input
                id="email"
                className={styles.input}
                type="email"
                autoComplete="email"
                placeholder="email@s1.co.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pw">
              비밀번호
            </label>
            <div className={styles.inputWrap}>
              <svg
                className={styles.inputIcon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                id="pw"
                className={styles.input}
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                tabIndex={-1}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {showPw ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M4 4l16 16" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.rowBetween}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>아이디 저장</span>
            </label>
            <button type="button" className={styles.linkBtn}>
              비밀번호 찾기
            </button>
          </div>

          {error && (
            <div className={styles.error} role="alert" key={error}>
              {error}
            </div>
          )}

          <button type="submit" className={styles.primaryBtn} disabled={busy}>
            {busy ? '로그인 중…' : '로그인'}
          </button>

          <button type="button" className={styles.ssoBtn}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z" />
            </svg>
            <span>SSO로 로그인</span>
          </button>

          <div className={styles.formFoot}>
            <span className={styles.copy}>© 2026 S1 Corporation. All rights reserved.</span>
            <span className={styles.footLinks}>
              <button type="button" className={styles.linkBtn}>
                Support
              </button>
              <button type="button" className={styles.linkBtn}>
                Security
              </button>
            </span>
          </div>

          {IS_DEV && (
            <div className={styles.hint}>
              데모 계정 (dev only): <span className={styles.hintCode}>admin@s1vaas.test</span> /{' '}
              <span className={styles.hintCode}>s1vaas</span>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
