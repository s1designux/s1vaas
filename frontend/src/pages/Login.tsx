import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import s1Wordmark from '@/assets/images/s1_wordmark.png';
import styles from './Login.module.css';

const IS_DEV = import.meta.env.DEV;

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const login = useAuthStore((s) => s.login);
  const nav = useNavigate();

  async function onSubmit(e: { preventDefault(): void }) {
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
      {/* 상단 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <Logo size={28} variant="symbol" />
          <span className={styles.headerBrandName}>에스원 클라우드</span>
        </div>
        <ThemeToggle />
      </header>

      {/* 중앙 폼 영역 */}
      <main className={styles.main}>
        <form className={styles.formCard} onSubmit={onSubmit} noValidate>
          <div className={styles.formTitle}>
            <img src={s1Wordmark} alt="에스원" className={styles.wordmark} style={{ width: 78, height: 30, objectFit: 'contain' }} />
          </div>

          <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <div className={styles.inputWrap}>
              <input
                id="email"
                className={styles.input}
                type="text"
                autoComplete="username"
                placeholder="아이디를 입력해주세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.inputWrap}>
              <input
                id="pw"
                className={[styles.input, styles.inputPw].join(' ')}
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호를 입력해주세요"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw((v) => !v)} aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'} tabIndex={-1}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
          </div>

          {error && (
            <div className={styles.error} role="alert" key={error}>{error}</div>
          )}

          <div className={styles.submitWrap}>
            <Button type="submit" variant="primary" size="md" block disabled={busy}>
              {busy ? '로그인 중…' : '로그인'}
            </Button>
          </div>

          <div className={styles.dividerRow}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>또는</span>
            <span className={styles.dividerLine} />
          </div>

          <Button type="button" variant="secondary" size="md" block>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z" />
            </svg>
            <span>SSO로 로그인</span>
          </Button>

          {IS_DEV && (
            <div className={styles.hint}>
              프로토타입 모드: 아무 아이디/비밀번호나 입력하면 로그인됩니다.
            </div>
          )}
        </form>
      </main>

      {/* 하단 푸터 */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <button type="button" className={styles.footerLinkBtn}>아이디 찾기</button>
          <span className={styles.footerSep}>|</span>
          <button type="button" className={styles.footerLinkBtn}>개인정보처리방침</button>
          <span className={styles.footerSep}>|</span>
          <button type="button" className={styles.footerLinkBtn}>고객센터</button>
        </div>
        <p className={styles.copyright}>© S-1 Corp. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
