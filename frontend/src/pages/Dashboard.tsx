// TODO: replace with fetch('/api/v1/dashboard/summary')
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '@/store/dataStore';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { EventDrawer } from '@/components/ui/EventDrawer';
import { useCountUp } from '@/hooks/useCountUp';
import type { AppEvent, EventLevel } from '@/types';
import styles from './Dashboard.module.css';

const LEVEL_TONE: Record<EventLevel, BadgeTone> = {
  info: 'info',
  warning: 'warn',
  danger: 'danger',
  success: 'success',
};

const LEVEL_LABEL: Record<EventLevel, string> = {
  info: '정보',
  warning: 'WARNING',
  danger: 'DANGER',
  success: 'SUCCESS',
};

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

const QUICK_PROMPTS: { label: string; text: string; icon: React.ReactNode }[] = [
  {
    label: '온라인 카메라 현황',
    text: '현재 온라인 상태인 카메라를 모두 보여줘',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="15" height="14" rx="2" />
        <path d="M17 10l5-3v10l-5-3z" />
      </svg>
    ),
  },
  {
    label: '시스템 건강 상태 요약',
    text: '현재 시스템 상태를 요약해줘',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h3l3-8 4 16 3-8h5" />
      </svg>
    ),
  },
  {
    label: '최근 1시간 이벤트 검색',
    text: '최근 1시간 이벤트를 모두 보여줘',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    label: '보안 위험 보고서',
    text: '보안 위험 보고서를 보여줘',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V7z" />
      </svg>
    ),
  },
];

/** KPI 카드 아이콘 */
function KpiIcon({ variant }: { variant: 'cam' | 'ok' | 'warn' | 'danger' }) {
  const iconProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const svg =
    variant === 'cam' ? (
      <svg {...iconProps}>
        <rect x="2" y="6" width="14" height="12" rx="2" />
        <path d="M16 10l5-3v10l-5-3z" />
      </svg>
    ) : variant === 'ok' ? (
      <svg {...iconProps}>
        <path d="M5 13l4 4L19 7" />
        <circle cx="12" cy="12" r="10" opacity="0.3" />
      </svg>
    ) : variant === 'warn' ? (
      <svg {...iconProps}>
        <path d="M12 3L2 21h20L12 3z" />
        <path d="M12 10v5" />
        <circle cx="12" cy="18" r="0.7" fill="currentColor" />
      </svg>
    ) : (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <circle cx="12" cy="16" r="0.7" fill="currentColor" />
      </svg>
    );
  return <div className={[styles.kpiIcon, styles[`kpiIcon_${variant}`]].join(' ')}>{svg}</div>;
}

function KpiCard({
  label,
  value,
  meta,
  metaTone,
  variant,
}: {
  label: string;
  value: number;
  meta?: string;
  metaTone?: 'muted' | 'success' | 'warn' | 'danger';
  variant: 'cam' | 'ok' | 'warn' | 'danger';
}) {
  const animated = useCountUp(value);
  const metaCls = [
    styles.kpiMeta,
    metaTone === 'success' ? styles.kpiMetaSuccess : '',
    metaTone === 'warn' ? styles.kpiMetaWarn : '',
    metaTone === 'danger' ? styles.kpiMetaDanger : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={styles.kpi}>
      <KpiIcon variant={variant} />
      <div className={styles.kpiLabel}>{label}</div>
      <div className={`${styles.kpiValue} tabular`}>{animated.toLocaleString()}</div>
      {meta && <div className={metaCls}>{meta}</div>}
    </div>
  );
}

function HealthItem({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone?: 'ok' | 'warn' | 'danger';
}) {
  return (
    <div className={styles.statusItem}>
      <div className={styles.statusTop}>
        <span className={styles.statusLabel}>{label}</span>
        <span className={styles.statusValue}>{percent}%</span>
      </div>
      <div className={styles.bar}>
        <div
          className={[
            styles.barFill,
            tone === 'warn' ? styles.barFillWarn : '',
            tone === 'danger' ? styles.barFillDanger : '',
          ].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** 이벤트 카드 — 시안: 좌측 썸네일 + 메시지 + 우측 상단 배지 + 사이트/시각 */
function EventCard({
  ev,
  site,
  onClick,
}: {
  ev: AppEvent;
  site?: string;
  onClick: () => void;
}) {
  const tone = LEVEL_TONE[ev.level];
  const label = LEVEL_LABEL[ev.level];
  const isDanger = ev.level === 'danger';
  const time = new Date(ev.occurredAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return (
    <button
      type="button"
      className={[styles.eventCard, isDanger ? styles.eventCardDanger : ''].join(' ')}
      onClick={onClick}
    >
      <div className={styles.eventThumb}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="14" height="12" rx="1.5" />
          <path d="M16 10l5-3v10l-5-3z" />
        </svg>
      </div>
      <div className={styles.eventBody}>
        <div className={styles.eventRow1}>
          <span className={styles.eventMsg}>{ev.message}</span>
          <Badge tone={tone} dot={false}>
            {label}
          </Badge>
        </div>
        <div className={styles.eventRow2}>
          <span>{site ?? '—'}</span>
          <span className={styles.eventTime}>· {time}</span>
        </div>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const cameras = useDataStore((s) => s.cameras);
  const events = useDataStore((s) => s.events);
  const sites = useDataStore((s) => s.sites);
  const [eventDetail, setEventDetail] = useState<AppEvent | null>(null);

  const kpi = useMemo(() => {
    const total = cameras.length;
    const online = cameras.filter((c) => c.status === 'online' || c.status === 'recording').length;
    const offline = cameras.filter((c) => c.status === 'offline').length;
    const unack = events.filter((e) => !e.acknowledged).length;
    const uptime = total > 0 ? Math.round((online / total) * 100) : 0;
    return { total, online, offline, unack, sites: sites.length, uptime };
  }, [cameras, events, sites]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).slice(0, 4),
    [events],
  );

  const sitePulse = useMemo(
    () =>
      sites.map((s) => {
        const siteCams = cameras.filter((c) => c.siteId === s.id);
        return {
          ...s,
          camCount: siteCams.length,
          onlineCount: siteCams.filter((c) => c.status !== 'offline').length,
        };
      }),
    [sites, cameras],
  );

  // AI chat — Ollama (via Vite /ollama proxy) with streaming
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text:
        '안녕하세요, 김관리님. 에스원 AI 비서입니다. 관제 중 궁금하신 사항이나 현재 상황 요약이 필요하시면 말씀해 주세요.',
      time: '오후 2:30',
    },
  ]);
  const [chatPending, setChatPending] = useState(false);
  const [ollamaModel, setOllamaModel] = useState<string>(
    'joonoh/HyperCLOVAX-SEED-Text-Instruct-1.5B:latest',
  );
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load model list once (through Vite proxy → Ollama /api/tags)
  useEffect(() => {
    let alive = true;
    fetch('/ollama/api/tags')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j?.models) return;
        const names: string[] = j.models.map((m: { name: string }) => m.name);
        setAvailableModels(names);
        if (!names.includes(ollamaModel) && names.length > 0) setOllamaModel(names[0]);
      })
      .catch(() => {
        /* Ollama not reachable — keep mock */
      });
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buildSystemPrompt = () => {
    const siteSummary = sites
      .map((s) => {
        const cs = cameras.filter((c) => c.siteId === s.id);
        const on = cs.filter((c) => c.status !== 'offline').length;
        return `- ${s.name}: ${on}/${cs.length} 온라인`;
      })
      .join('\n');
    return [
      '너는 에스원 클라우드 VSaaS(영상보안 SaaS) 관제 대시보드의 AI 비서다.',
      '역할: 관리자 사용자에게 현재 시스템 상태를 한국어로 간결하게 설명하고, 카메라·이벤트·사이트 조회 질문에 답한다.',
      '답변 원칙: 한국어, 200자 내외, 필요 시 불릿(•) 사용, 수치는 정확히, 답을 모르면 솔직히 말한다.',
      '',
      '실시간 컨텍스트:',
      `- 전체 카메라: ${kpi.total}대 / 온라인: ${kpi.online}대 / 오프라인: ${kpi.offline}대`,
      `- 미확인 이벤트: ${kpi.unack}건`,
      `- 사이트 수: ${kpi.sites}개`,
      '',
      '사이트별 가동 상태:',
      siteSummary,
    ].join('\n');
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatPending) return;
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { id: Date.now(), role: 'user', text: trimmed, time: now };
    const botId = Date.now() + 1;
    const botMsg: ChatMessage = { id: botId, role: 'assistant', text: '', time: now };
    setChatLog((prev) => [...prev, userMsg, botMsg]);
    setChatInput('');
    setChatPending(true);
    window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);

    const history = chatLog
      .filter((m) => m.text.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const res = await fetch('/ollama/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          stream: true,
          // qwen3 / gemma3 류 thinking 모델이 <think> 토큰으로 토큰 예산 다 먹어버리는 것 방지
          think: false,
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...history,
            { role: 'user', content: trimmed },
          ],
          options: { temperature: 0.3, num_predict: 1024 },
        }),
      });
      if (!res.ok || !res.body) throw new Error(`status ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            // content 가 비면 일부 모델은 thinking 에만 담기도 함 → fallback 으로 thinking 도 받음
            const piece: string =
              obj?.message?.content || obj?.message?.thinking || '';
            if (piece) {
              acc += piece;
              setChatLog((prev) => prev.map((m) => (m.id === botId ? { ...m, text: acc } : m)));
              window.setTimeout(
                () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
                20,
              );
            }
          } catch {
            /* skip malformed line */
          }
        }
      }
      if (!acc) {
        setChatLog((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, text: '(모델에서 응답이 비어있습니다)' } : m,
          ),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      setChatLog((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                text:
                  `⚠ Ollama 연결 실패: ${msg}\n\n1) \`ollama serve\` 가 실행 중인지 확인\n` +
                  `2) 모델 \`${ollamaModel}\` 이 설치되어 있는지 확인 (\`ollama list\`)\n` +
                  '3) Vite dev proxy 가 /ollama → :11434 로 설정되어 있는지 확인',
              }
            : m,
        ),
      );
    } finally {
      setChatPending(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        {/* 4 KPI row */}
        <div className={styles.kpiRow}>
          <KpiCard
            label="전체 카메라"
            value={kpi.total}
            meta={`${sites.length}개 계약`}
            metaTone="muted"
            variant="cam"
          />
          <KpiCard
            label="정상 운영"
            value={kpi.online}
            meta={`${kpi.uptime}% 가동률`}
            metaTone="success"
            variant="ok"
          />
          <KpiCard
            label="이상 감지"
            value={events.filter((e) => e.level === 'warning').length}
            meta="주의 필요"
            metaTone="warn"
            variant="warn"
          />
          <KpiCard
            label="연결 끊김"
            value={kpi.offline}
            meta={kpi.offline > 0 ? '즉시 확인 필요' : '정상'}
            metaTone={kpi.offline > 0 ? 'danger' : 'success'}
            variant="danger"
          />
        </div>

        {/* System health + Events */}
        <div className={styles.row2}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>시스템 현황</span>
              <span className={styles.panelMore}>⋯</span>
            </div>
            <div className={styles.statusList}>
              <HealthItem label="CPU 사용률" percent={34} />
              <HealthItem label="메모리 사용률" percent={67} tone="warn" />
              <HealthItem label="저장소 잔여 용량" percent={52} />
              <HealthItem label="네트워크 대역폭" percent={28} />
            </div>
            <div className={styles.siteDivider} />
            <div className={styles.sitePulse}>
              {sitePulse.slice(0, 3).map((s) => (
                <div key={s.id} className={styles.sitePulseRow}>
                  <span className={styles.siteDot} data-ok={s.onlineCount === s.camCount} />
                  <span className={styles.sitePulseName}>{s.name}</span>
                  <span className={[
                    styles.sitePulseStatus,
                    s.onlineCount !== s.camCount ? styles.sitePulseStatusWarn : '',
                  ].join(' ')}>
                    {s.onlineCount === s.camCount ? '안정적' : '주의'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>실시간 이벤트</span>
              <button
                type="button"
                className={styles.panelLink}
                onClick={() => nav('/alerts')}
              >
                전체보기
              </button>
            </div>
            <div className={styles.eventList}>
              {sortedEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  ev={ev}
                  site={sites.find((s) => s.id === ev.siteId)?.name}
                  onClick={() => setEventDetail(ev)}
                />
              ))}
              {sortedEvents.length === 0 && (
                <div className={styles.eventEmpty}>최근 이벤트가 없습니다.</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* AI 영상 비서 — right column */}
      <aside className={styles.aiCol}>
        <div className={styles.aiHeader}>
          <div className={styles.aiAvatar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="7" width="14" height="11" rx="3" />
              <path d="M12 7V4M9 4h6M9 12h.01M15 12h.01M9 15h6" />
            </svg>
          </div>
          <div className={styles.aiTitleBox}>
            <span className={styles.aiTitle}>AI 영상 비서</span>
            <span className={styles.aiStatus}>
              <span className={styles.aiDot} />
              {chatPending ? '응답 생성 중…' : availableModels.length > 0 ? 'Ollama 연결됨' : '오프라인(mock)'}
            </span>
          </div>
          {availableModels.length > 0 && (
            <select
              className={styles.aiModelSelect}
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              disabled={chatPending}
              title="Ollama 모델 선택"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.chatLog}>
          {chatLog.map((m) => (
            <div
              key={m.id}
              className={[styles.chatMsg, m.role === 'user' ? styles.chatMsgUser : styles.chatMsgBot].join(' ')}
            >
              <div className={m.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot}>{m.text}</div>
              <span className={styles.chatTime}>{m.time}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className={styles.aiRecoTitle}>추천 작업</div>
        <div className={styles.aiRecoGrid}>
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.label}
              className={styles.aiRecoBtn}
              onClick={() => sendMessage(q.text)}
              type="button"
            >
              <span className={styles.aiRecoIcon}>{q.icon}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.aiInputRow}>
          <input
            type="text"
            className={styles.aiInput}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(chatInput);
              }
            }}
            placeholder={chatPending ? '답변 생성 중…' : '질문을 입력하세요…'}
            disabled={chatPending}
          />
          <button
            type="button"
            className={styles.aiSendBtn}
            onClick={() => sendMessage(chatInput)}
            disabled={chatPending || !chatInput.trim()}
            aria-label="전송"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </div>
      </aside>

      <EventDrawer event={eventDetail} onClose={() => setEventDetail(null)} />
    </div>
  );
}
