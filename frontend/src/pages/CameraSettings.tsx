// TODO: replace with fetch('/api/v1/cameras/{id}') + PATCH
// 카메라 관리 — AI 카메라 Process Flow(V0.76) 사양 기반 상세화.
//   설정 체계: 실시간영상(100 LIVE) / 시스템(310/320) / 네트워크(410/420) / 비디오(510) / 이미지(610·620)
//   실시간영상 탭 = 라이브 영상 + 기본 정보 + OSD 설정.
//   AI 이벤트(침입·배회·가상펜스·화재·주정차·피플카운팅)·움직임 감지·감지 스케줄,
//   그리고 프라이버시 마스크(630)는 [안심 AI 설정]으로 이관 — 여기서는 다루지 않는다.
import React, { useEffect, useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Chip } from '@/components/ui/Chip';
import { Toggle } from '@/components/ui/Toggle';
import page from './Page.module.css';
import cs from './CameraSettings.module.css';

type SettingsTab = 'live' | 'system' | 'network' | 'video';

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: 'live', label: '실시간영상' },
  { key: 'system', label: '시스템' },
  { key: 'network', label: '네트워크' },
  { key: 'video', label: '비디오' },
];

/* ---------- 공용 폼 헬퍼 ---------- */

function Kv({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={page.kvRow}>
      <span className={page.kvLabel}>{label}</span>
      <span className={page.kvVal}>{value}</span>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  on,
  onToggle,
}: {
  title: string;
  desc?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={page.settingsRow}>
      <div>
        <div className={page.settingsRowTitle}>{title}</div>
        {desc && <div className={page.settingsRowDesc}>{desc}</div>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

interface Opt<T> {
  value: T;
  label: string;
}

function Seg<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Opt<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className={cs.segRow}>
      <span className={page.formLabel}>{label}</span>
      <div className={page.chips}>
        {options.map((o) => (
          <Chip
            key={String(o.value)}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

// DS Select 위임 (제네릭 string|number → DS는 string. 매핑은 여기서 처리)
function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Opt<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <Select
      label={label}
      value={String(value)}
      options={options.map((o) => ({ value: String(o.value), label: o.label }))}
      onChange={(raw) => {
        const match = options.find((o) => String(o.value) === raw);
        if (match) onChange(match.value);
      }}
    />
  );
}

// DS Input 위임
function InputField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <Input
      label={label}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function EditSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={page.progressRow}>
      <div className={page.progressTop}>
        <span className={page.kvLabel}>{label}</span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 'var(--font-weight-semibold)', fontFamily: 'var(--font-mono)' }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--color-accent)' }}
      />
    </div>
  );
}

/* ---------- 메인 ---------- */

interface StreamCfg {
  resolution: string;
  bitrateType: string;
  quality: string;
  fps: number;
  codec: string;
}

const FPS_OPTIONS: Opt<number>[] = [5, 10, 15, 20, 25, 30].map((v) => ({ value: v, label: String(v) }));
const RES_OPTIONS: Opt<string>[] = [
  { value: '1920x1080P', label: '1920×1080P' },
  { value: '1280x720P', label: '1280×720P' },
  { value: '640x360P', label: '640×360P' },
];
const QUALITY_OPTIONS: Opt<string>[] = ['매우 좋음', '좋음', '보통', '낮음', '매우 낮음'].map((v) => ({ value: v, label: v }));

export default function CameraSettings() {
  const cameras   = useDataStore((s) => s.cameras);
  const sites     = useDataStore((s) => s.sites);
  const contracts = useDataStore((s) => s.contracts);

  // 계약처 필터
  const [selectedContractId, setSelectedContractId] = useState<string>(() => contracts[0]?.id ?? '');

  const filteredSites = useMemo(
    () => sites.filter((s) => s.contractId === selectedContractId),
    [sites, selectedContractId],
  );

  // 아코디언 그룹: 사이트 단위 (하나만 펼침)
  const [openSiteId, setOpenSiteId] = useState<string>(() => filteredSites[0]?.id ?? '');

  // 계약처 변경 시 첫 사이트 자동 열기
  useEffect(() => {
    setOpenSiteId(filteredSites[0]?.id ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContractId]);

  const toggleAccordion = (siteId: string) =>
    setOpenSiteId((prev) => (prev === siteId ? '' : siteId));

  // 초기 선택: 첫 번째 카메라
  const [activeId, setActiveId] = useState(() => cameras[0]?.id ?? '');
  const [tab, setTab] = useState<SettingsTab>('live');
  const [liveTab, setLiveTab] = useState<'osd' | 'image'>('osd');

  const cam = cameras.find((c) => c.id === activeId);
  const offline = cam?.status === 'offline';

  // 실시간영상 미리보기용 mock 비디오 인덱스 (1..6)
  const videoIdx = useMemo(() => {
    const idx = cameras.findIndex((c) => c.id === activeId);
    return ((idx < 0 ? 0 : idx) % 6) + 1;
  }, [cameras, activeId]);

  // ---- 시스템 / 날짜·시간 ----
  const [timezone, setTimezone] = useState('GMT+09:00');
  const [timeMode, setTimeMode] = useState<'ntp' | 'manual'>('ntp');
  const [ntpServer, setNtpServer] = useState('time.s1.co.kr');
  const [ntpPort, setNtpPort] = useState('123');
  const [ntpCycle, setNtpCycle] = useState('1');
  // ---- 시스템 / 보안 ----
  const [autoLogout, setAutoLogout] = useState('30');
  const [pwdValidity, setPwdValidity] = useState('90');

  // ---- 네트워크 / TCP·IP ----
  const [nicSpeed, setNicSpeed] = useState('auto');
  const [dhcp, setDhcp] = useState(false);
  const [dns1, setDns1] = useState('168.126.63.1');
  const [dns2, setDns2] = useState('8.8.8.8');
  // ---- 네트워크 / DDNS ----
  const [ddnsOn, setDdnsOn] = useState(true);
  // ---- 네트워크 / 포트 ----
  const [httpPort, setHttpPort] = useState('80');
  const [httpsPort, setHttpsPort] = useState('443');
  const [rtspPort, setRtspPort] = useState('554');
  const [portMapMode, setPortMapMode] = useState<'auto' | 'manual'>('auto');
  const [upnp, setUpnp] = useState(true);
  const [httpsUse, setHttpsUse] = useState(true);
  // ---- 네트워크 / 고급설정 ----
  const [tlsEncrypt, setTlsEncrypt] = useState(true);
  const [serverCert, setServerCert] = useState('self');
  const [ipFilterOn, setIpFilterOn] = useState(false);
  const [ipFilterMode, setIpFilterMode] = useState<'deny' | 'allow'>('deny');
  const [rtspAuth, setRtspAuth] = useState('digest');
  const [webAuth, setWebAuth] = useState('sha256');
  const [streamEncrypt, setStreamEncrypt] = useState(true);

  // ---- 비디오 ----
  const [streamSel, setStreamSel] = useState<'main' | 'sub1' | 'sub2'>('main');
  const [streams, setStreams] = useState<Record<'main' | 'sub1' | 'sub2', StreamCfg>>({
    main: { resolution: '1920x1080P', bitrateType: 'VBR', quality: '매우 좋음', fps: 30, codec: 'H.265' },
    sub1: { resolution: '1280x720P', bitrateType: 'VBR', quality: '좋음', fps: 15, codec: 'H.264' },
    sub2: { resolution: '640x360P', bitrateType: 'CBR', quality: '보통', fps: 15, codec: 'H.264' },
  });
  const patchStream = (patch: Partial<StreamCfg>) =>
    setStreams((s) => ({ ...s, [streamSel]: { ...s[streamSel], ...patch } }));
  const cur = streams[streamSel];

  // ---- 이미지 / 영상 설정 ----
  const [img, setImg] = useState({ brightness: 50, sharpness: 50, contrast: 50, saturation: 50, gain: 50 });
  const patchImg = (patch: Partial<typeof img>) => setImg((s) => ({ ...s, ...patch }));
  const [dayNight, setDayNight] = useState('auto');
  const [irMode, setIrMode] = useState('auto');
  const [flip, setFlip] = useState('off');
  const [noiseOn, setNoiseOn] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState(50);
  const [wdr, setWdr] = useState('off');
  const [blc, setBlc] = useState('off');
  const [wb, setWb] = useState('awb1');
  // ---- 이미지 / 노출 (PPTX 610-1/3) ----
  const [aperture, setAperture] = useState('auto');
  const [exposureTime, setExposureTime] = useState('auto');
  // IR 조명 밝기 (PPTX 610-2/3, IR 수동 시)
  const [irBrightness, setIrBrightness] = useState(100);

  // ---- 이미지 / OSD ----
  const [osdName, setOsdName] = useState(true);
  const [camLabel, setCamLabel] = useState(cam ? cam.name.split(' ')[0] : 'CAM');
  const [osdDate, setOsdDate] = useState(true);
  const [timeFormat, setTimeFormat] = useState<'24' | '12'>('24');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [osdWeekday, setOsdWeekday] = useState(false);

  // 카메라 전환 시 OSD 이름 초기화
  useEffect(() => {
    if (cam) setCamLabel(cam.name.split(' ')[0]);
  }, [activeId, cam]);

  // OSD 시계 — 1초마다 갱신
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const osdTimeStr = useMemo(() => {
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    if (timeFormat === '12') {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = ((h % 12) || 12).toString().padStart(2, '0');
      return `${h12}:${m}:${s} ${ampm}`;
    }
    return `${h.toString().padStart(2, '0')}:${m}:${s}`;
  }, [now, timeFormat]);

  const osdDateStr = useMemo(() => {
    const y = now.getFullYear();
    const mo = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const wd = osdWeekday ? ` ${WEEKDAYS[now.getDay()]}` : '';
    switch (dateFormat) {
      case 'MM-DD-YYYY': return `${mo}-${d}-${y}${wd}`;
      case 'YYYY/MM/DD': return `${y}/${mo}/${d}${wd}`;
      case 'MM/DD/YYYY': return `${mo}/${d}/${y}${wd}`;
      default: return `${y}-${mo}-${d}${wd}`;
    }
  }, [now, dateFormat, osdWeekday]);

  // 이미지 설정 → 비디오 CSS 필터 + 반전 트랜스폼
  const videoStyle = useMemo(() => {
    const b = img.brightness / 50;
    const c = img.contrast / 50;
    const sat = img.saturation / 50;
    const sharpBoost = img.sharpness > 50 ? ` contrast(${1 + (img.sharpness - 50) * 0.008})` : '';
    const flipMap: Record<string, string> = { h: 'scaleX(-1)', v: 'scaleY(-1)', '180': 'rotate(180deg)' };
    return {
      filter: `brightness(${b.toFixed(2)}) contrast(${c.toFixed(2)}) saturate(${sat.toFixed(2)})${sharpBoost}`,
      transform: flipMap[flip] ?? 'none',
    } as React.CSSProperties;
  }, [img, flip]);

  const serial  = cam ? `S1CAM2026${cam.id.slice(-4).padStart(6, '0')}` : '';
  const macAddr = cam ? `A4:5E:60:${cam.id.slice(-2).toUpperCase().padStart(2, '0')}:1B:7C` : '';


  return (
    <div className={cs.wrap}>
      <div className={cs.container}>
      <div className={cs.body}>
        {/* ── 좌측 아코디언 사이드바 ── */}
        <aside className={cs.sidebar}>
          {/* 계약처 셀렉트 (DS Select) */}
          <div style={{ marginBottom: 8 }}>
            <Select
              size="sm"
              value={selectedContractId}
              options={contracts.map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))}
              onChange={(v) => setSelectedContractId(v)}
            />
          </div>

          {/* 사이트 아코디언 */}
          {filteredSites.map((site) => {
            const isOpen   = openSiteId === site.id;
            const siteCams = cameras.filter((c) => c.siteId === site.id);
            return (
              <div key={site.id} className={cs.accordionCard}>
                <button
                  className={cs.accordionHeader}
                  onClick={() => toggleAccordion(site.id)}
                >
                  <span className={cs.accordionTitle}>
                    {site.name}
                    <span className={cs.accordionCount}>{siteCams.length}</span>
                  </span>
                  <svg
                    className={`${cs.accordionChevron} ${isOpen ? cs.accordionChevronOpen : ''}`}
                    width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>

                {isOpen && (
                  <div className={cs.accordionList}>
                    {siteCams.map((c) => {
                      const isActive = c.id === activeId;
                      const chipCls =
                        c.status === 'offline' ? cs.statusChipOffline : cs.statusChipOnline;
                      const statusLabel =
                        c.status === 'offline' ? '오프라인' : '온라인';
                      return (
                        <button
                          key={c.id}
                          className={`${cs.accordionItem} ${isActive ? cs.accordionItemActive : ''}`}
                          onClick={() => setActiveId(c.id)}
                          title={c.name}
                        >
                          <span className={`${cs.statusChip} ${chipCls}`}>
                            {c.status === 'offline' ? 'OFF' : 'ON'}
                          </span>
                          <span className={cs.itemInfo}>
                            <span className={`${cs.itemName} ${isActive ? cs.itemNameActive : ''}`}>
                              {c.name}
                            </span>
                            <span className={cs.itemStatusText}>{statusLabel}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 미지정 카메라 */}
          {(() => {
            const unassigned = cameras.filter((c) => c.siteId === null && c.contractId === selectedContractId);
            if (unassigned.length === 0) return null;
            const uid = '__unassigned';
            const isOpen = openSiteId === uid;
            return (
              <div className={cs.accordionCard}>
                <button className={cs.accordionHeader} onClick={() => toggleAccordion(uid)}>
                  <span className={cs.accordionTitle}>
                    미지정
                    <span className={cs.accordionCount}>{unassigned.length}</span>
                  </span>
                  <svg
                    className={`${cs.accordionChevron} ${isOpen ? cs.accordionChevronOpen : ''}`}
                    width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                {isOpen && (
                  <div className={cs.accordionList}>
                    {unassigned.map((c) => {
                      const isActive = c.id === activeId;
                      const chipCls =
                        c.status === 'offline' ? cs.statusChipOffline : cs.statusChipOnline;
                      const statusLabel =
                        c.status === 'offline' ? '오프라인' : '온라인';
                      return (
                        <button
                          key={c.id}
                          className={`${cs.accordionItem} ${isActive ? cs.accordionItemActive : ''}`}
                          onClick={() => setActiveId(c.id)}
                          title={c.name}
                        >
                          <span className={`${cs.statusChip} ${chipCls}`}>
                            {c.status === 'offline' ? 'OFF' : 'ON'}
                          </span>
                          <span className={cs.itemInfo}>
                            <span className={`${cs.itemName} ${isActive ? cs.itemNameActive : ''}`}>
                              {c.name}
                            </span>
                            <span className={cs.itemStatusText}>{statusLabel}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </aside>

        {/* ── 우측 콘텐츠 ── */}
        {!cam ? (
          <div className={cs.content}>
            <div className={cs.empty}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              좌측 트리에서 카메라를 선택하세요.
            </div>
          </div>
        ) : (
          <div className={`${cs.content}${tab === 'live' ? ` ${cs.contentLive}` : ''}`}>
            {/* 카메라 타이틀 */}
            <div className={cs.contentHeader}>
              <span className={cs.contentTitle}>{cam.name}</span>
              <Badge tone={cam.status === 'offline' ? 'danger' : 'success'} dot>
                {cam.status === 'offline' ? '오프라인' : '온라인'}
              </Badge>
            </div>

            {/* 설정 탭 */}
            <div className={cs.settingsTabs}>
              {SETTINGS_TABS.map((t) => (
                <button
                  key={t.key}
                  className={`${cs.settingsTab} ${tab === t.key ? cs.settingsTabActive : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

      {/* ===== 실시간영상 ===== */}
      {tab === 'live' && (
        <div className={cs.liveLayout}>
          {/* 좌측: 카메라 + 기본 정보 */}
          <div className={cs.liveCamera}>
            <div className={page.preview}>
              {!offline && (
                <video
                  className={page.previewVideo}
                  src={`/mock-cctv/cam_0${videoIdx}.mp4`}
                  autoPlay loop muted playsInline preload="auto"
                  style={videoStyle}
                />
              )}
              {offline && <span style={{ position: 'relative', zIndex: 2 }}>OFFLINE</span>}
              {!offline && (osdName || osdDate) && (
                <div className={cs.osdOverlay}>
                  <div className={cs.osdTop}>
                    {osdName && <span className={cs.osdText}>{camLabel || ' '}</span>}
                  </div>
                  <div className={cs.osdBottom}>
                    {osdDate && (
                      <>
                        <span className={cs.osdText}>{osdDateStr}</span>
                        <span className={cs.osdText}>{osdTimeStr}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className={cs.liveCameraInfo}>
              <div className={cs.camInfoGrid}>
                {(
                  [
                    ['접속 상태', cam.status === 'offline' ? '오프라인' : '온라인'],
                    ['제품 코드', `SVI-${cam.model}`],
                    ['제조번호 (S/N)', serial],
                    ['제품등록번호', `R-${serial.slice(-8)}`],
                    ['MAC 주소', macAddr],
                    ['F/W 버전', cam.firmware],
                    ['F/W 빌드 날짜', '2026-03-18'],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label} className={cs.camInfoRow}>
                    <span className={cs.camInfoLabel}>{label}</span>
                    <span className={cs.camInfoVal}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 채널 / 정보 구분선 */}
          <div className={cs.liveDivider} aria-hidden />

          {/* 우측: 기본 정보 / OSD 설정 라인탭 패널 (탭바 고정, 내용만 스크롤) */}
          <div className={cs.livePanel}>
            <div className={cs.livePanelTabBar}>
              <button
                className={`${cs.livePanelTab} ${liveTab === 'osd' ? cs.livePanelTabActive : ''}`}
                onClick={() => setLiveTab('osd')}
              >
                OSD 설정
              </button>
              <button
                className={`${cs.livePanelTab} ${liveTab === 'image' ? cs.livePanelTabActive : ''}`}
                onClick={() => setLiveTab('image')}
              >
                이미지 설정
              </button>
            </div>

            <div className={cs.livePanelBody}>
              {/* ── OSD 설정 탭 ── */}
              {liveTab === 'osd' && (
                <>
                  <ToggleRow title="카메라 이름 표시" on={osdName} onToggle={() => setOsdName(!osdName)} />
                  {osdName && <InputField label="이름 (최대 10자)" value={camLabel} onChange={setCamLabel} maxLength={10} />}
                  <ToggleRow title="날짜 표시" on={osdDate} onToggle={() => setOsdDate(!osdDate)} />
                  {osdDate && (
                    <>
                      <Seg
                        label="시간 표시"
                        value={timeFormat}
                        onChange={setTimeFormat}
                        options={[{ value: '24', label: '24시간' }, { value: '12', label: '12시간' }]}
                      />
                      <SelectField
                        label="날짜 형식"
                        value={dateFormat}
                        onChange={setDateFormat}
                        options={[
                          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                          { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' },
                          { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
                          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                        ]}
                      />
                      <ToggleRow title="요일 표시" on={osdWeekday} onToggle={() => setOsdWeekday(!osdWeekday)} />
                    </>
                  )}
                  <Kv label="텍스트 삽입" value="최대 5개 · 각 10자" />
                </>
              )}

              {/* ── 이미지 설정 탭 ── */}
              {liveTab === 'image' && (
                <>
                  <div className={page.sectionCaption}>이미지 조정 (0~100)</div>
                  <EditSlider label="밝기" value={img.brightness} min={0} max={100} onChange={(v) => patchImg({ brightness: v })} />
                  <EditSlider label="선명도" value={img.sharpness} min={0} max={100} onChange={(v) => patchImg({ sharpness: v })} />
                  <EditSlider label="대비" value={img.contrast} min={0} max={100} onChange={(v) => patchImg({ contrast: v })} />
                  <EditSlider label="채도" value={img.saturation} min={0} max={100} onChange={(v) => patchImg({ saturation: v })} />
                  <EditSlider label="Gain" value={img.gain} min={0} max={100} onChange={(v) => patchImg({ gain: v })} />

                  <div className={page.sectionCaption}>노출</div>
                  <SelectField
                    label="조리개 모드"
                    value={aperture}
                    onChange={setAperture}
                    options={[
                      { value: 'auto', label: '자동' },
                      { value: 'manual', label: '수동' },
                    ]}
                  />
                  <SelectField
                    label="노출 시간"
                    value={exposureTime}
                    onChange={setExposureTime}
                    options={[
                      { value: 'auto', label: '자동' },
                      { value: '1/30', label: '1/30초' },
                      { value: '1/60', label: '1/60초' },
                      { value: '1/100', label: '1/100초' },
                      { value: '1/250', label: '1/250초' },
                      { value: '1/500', label: '1/500초' },
                    ]}
                  />

                  <div className={page.sectionCaption}>화이트 밸런스</div>
                  <SelectField
                    label="화이트 밸런스"
                    value={wb}
                    onChange={setWb}
                    options={[
                      { value: 'awb1', label: '자동 화이트 밸런스 1' },
                      { value: 'awb2', label: '자동 화이트 밸런스 2' },
                      { value: 'manual', label: '수동' },
                      { value: 'lock', label: '화이트 밸런스 잠금' },
                    ]}
                  />

                  <div className={page.sectionCaption}>주간 / 야간</div>
                  <SelectField
                    label="주야간 모드"
                    value={dayNight}
                    onChange={setDayNight}
                    options={[
                      { value: 'auto', label: '자동' },
                      { value: 'day', label: '주간' },
                      { value: 'night', label: '야간' },
                      { value: 'schedule', label: '스케줄 전환' },
                    ]}
                  />
                  <SelectField
                    label="IR 보조등"
                    value={irMode}
                    onChange={setIrMode}
                    options={[
                      { value: 'auto', label: '자동' },
                      { value: 'manual', label: '수동' },
                      { value: 'off', label: '끄기' },
                    ]}
                  />
                  {irMode === 'manual' && (
                    <EditSlider label="IR 조명 밝기 (1~100)" value={irBrightness} min={1} max={100} onChange={setIrBrightness} />
                  )}

                  <div className={page.sectionCaption}>영상 보정</div>
                  <SelectField
                    label="영상 반전 / 회전"
                    value={flip}
                    onChange={setFlip}
                    options={[
                      { value: 'off', label: '끄기' },
                      { value: 'h', label: '좌우 반전' },
                      { value: 'v', label: '상하 반전' },
                      { value: '180', label: '180도 회전' },
                    ]}
                  />
                  <ToggleRow title="노이즈 제거" on={noiseOn} onToggle={() => setNoiseOn(!noiseOn)} />
                  {noiseOn && <EditSlider label="노이즈 감소 레벨 (5~100)" value={noiseLevel} min={5} max={100} onChange={setNoiseLevel} />}
                  <SelectField
                    label="WDR"
                    value={wdr}
                    onChange={setWdr}
                    options={[{ value: 'off', label: '끄기' }, { value: 'on', label: '켜기' }, { value: 'auto', label: '자동' }]}
                  />
                  <SelectField
                    label="역광 보정 (BLC)"
                    value={blc}
                    onChange={setBlc}
                    options={[{ value: 'off', label: '끄기' }, { value: 'on', label: '켜기' }]}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== 시스템 ===== */}
      {tab === 'system' && (
        <div className={cs.tabContentGrid}>

          <Card title="빠른 정보">
            <Kv label="모델" value={cam.model} />
            <Kv label="펌웨어" value={cam.firmware} />
            <Kv label="IP" value={cam.ip} />
            <Kv label="코덱" value={cam.codec} />
            <Kv label="해상도" value={cam.resolution} />
            <Kv label="저장소" value={`${cam.storageGb} GB`} />
          </Card>

          <Card title="날짜 · 시간">
            <div className={page.formStack}>
              <SelectField
                label="표준 시간대"
                value={timezone}
                onChange={setTimezone}
                options={[
                  { value: 'GMT+09:00', label: 'GMT+09:00 서울' },
                  { value: 'GMT+00:00', label: 'GMT+00:00 UTC' },
                  { value: 'GMT-08:00', label: 'GMT-08:00 LA(미국)' },
                ]}
              />
              <Seg
                label="시간 동기화"
                value={timeMode}
                onChange={setTimeMode}
                options={[
                  { value: 'ntp', label: '자동 (NTP)' },
                  { value: 'manual', label: '수동 (PC 연동)' },
                ]}
              />
              {timeMode === 'ntp' && (
                <>
                  <div className={page.rowCols2}>
                    <InputField label="NTP 서버 주소" value={ntpServer} onChange={setNtpServer} />
                    <InputField label="NTP 포트" value={ntpPort} onChange={setNtpPort} />
                  </div>
                  <SelectField
                    label="업데이트 주기"
                    value={ntpCycle}
                    onChange={setNtpCycle}
                    options={[
                      { value: '1', label: '1시간' },
                      { value: '6', label: '6시간' },
                      { value: '24', label: '24시간' },
                    ]}
                  />
                </>
              )}
              {timeMode === 'manual' && <Kv label="PC 시간 연동" value="현재 PC 시간으로 동기화" />}
            </div>
          </Card>

          {/* Row 2: 유지 보수(3행, medium-tall) | 보안(2 select, medium) */}
          <Card title="유지 보수">
            <div className={page.settingsRow}>
              <div><div className={page.settingsRowTitle}>재부팅</div></div>
              <Button variant="secondary" size="sm">실행</Button>
            </div>
            <div className={page.settingsRow}>
              <div>
                <div className={page.settingsRowTitle}>공장 초기화</div>
                <div className={page.settingsRowDesc}>네트워크 정보 제외 옵션 지원.</div>
              </div>
              <Button variant="secondary" size="sm">실행</Button>
            </div>
            <div className={page.settingsRow}>
              <div>
                <div className={page.settingsRowTitle}>설정 내보내기 / 불러오기</div>
                <div className={page.settingsRowDesc}>파일 암호 설정 가능.</div>
              </div>
              <Button variant="secondary" size="sm">관리</Button>
            </div>
          </Card>

          <Card title="보안">
            <div className={page.formStack}>
              <SelectField
                label="자동 로그아웃 (분)"
                value={autoLogout}
                onChange={setAutoLogout}
                options={[10, 20, 30, 40, 50, 60].map((v) => ({ value: String(v), label: `${v}분` }))}
              />
              <SelectField
                label="비밀번호 유효기간 (일)"
                value={pwdValidity}
                onChange={setPwdValidity}
                options={[30, 60, 90, 120, 180].map((v) => ({ value: String(v), label: `${v}일` }))}
              />
            </div>
          </Card>

          {/* Row 3: 펌웨어(1행, short) | 시스템 로그(short) */}
          <Card title="펌웨어">
            <div className={page.settingsRow}>
              <div>
                <div className={page.settingsRowTitle}>F/W 업그레이드</div>
                <div className={page.settingsRowDesc}>PC에서 펌웨어 파일을 선택해 업그레이드합니다.</div>
              </div>
              <Button variant="secondary" size="sm">파일 선택</Button>
            </div>
          </Card>

          <Card title="시스템 로그">
            <Kv label="로그 유형" value="시스템 · 이벤트" />
            <div className={page.settingsRow}>
              <div>
                <div className={page.settingsRowTitle}>목록 내보내기</div>
                <div className={page.settingsRowDesc}>*.csv 파일로 저장.</div>
              </div>
              <Button variant="secondary" size="sm">내보내기</Button>
            </div>
          </Card>

        </div>
      )}

      {/* ===== 네트워크 ===== */}
      {tab === 'network' && (
        <div className={cs.tabContentGrid}>

          {/* Row 1: TCP/IP(tall) | 고급설정(tall) */}
          <Card title="TCP / IP">
            <div className={page.formStack}>
              <SelectField
                label="NIC 속도"
                value={nicSpeed}
                onChange={setNicSpeed}
                options={[
                  { value: 'auto', label: '자동' },
                  { value: '10h', label: '10M Half-dup' },
                  { value: '10f', label: '10M Full-dup' },
                  { value: '100h', label: '100M Half-dup' },
                  { value: '100f', label: '100M Full-dup' },
                ]}
              />
              <ToggleRow title="DHCP" desc="자동으로 IP 주소를 할당받습니다 (초기값: 해제)." on={dhcp} onToggle={() => setDhcp(!dhcp)} />
              <Kv label="IPv4 주소" value={cam.ip} />
              <Kv label="서브넷 마스크" value="255.255.255.0" />
              <Kv label="기본 게이트웨이" value={`${cam.ip.split('.').slice(0, 3).join('.')}.1`} />
              <Kv label="MAC 주소" value={macAddr} />
              <div className={page.rowCols2}>
                <InputField label="DNS" value={dns1} onChange={setDns1} />
                <InputField label="DNS2" value={dns2} onChange={setDns2} />
              </div>
            </div>
          </Card>

          <Card title="고급 설정">
            <div className={page.formStack}>
              <div className={page.sectionCaption}>TLS</div>
              <ToggleRow title="영상전송 구간 암호화 (TLS)" on={tlsEncrypt} onToggle={() => setTlsEncrypt(!tlsEncrypt)} />
              <SelectField
                label="서버 인증서"
                value={serverCert}
                onChange={setServerCert}
                options={[
                  { value: 'self', label: '자체 인증서' },
                  { value: 'public', label: '공개 인증서' },
                  { value: 'none', label: '인증서 없음' },
                ]}
              />
              <div className={page.sectionCaption}>인증</div>
              <ToggleRow title="IP 필터링" on={ipFilterOn} onToggle={() => setIpFilterOn(!ipFilterOn)} />
              {ipFilterOn && (
                <Seg
                  label="필터링 구분"
                  value={ipFilterMode}
                  onChange={setIpFilterMode}
                  options={[{ value: 'deny', label: '제한' }, { value: 'allow', label: '허용' }]}
                />
              )}
              <SelectField
                label="RTSP 인증 알고리즘"
                value={rtspAuth}
                onChange={setRtspAuth}
                options={[{ value: 'digest', label: '다이제스트' }, { value: 'basic', label: 'Basic' }]}
              />
              <SelectField
                label="WEB 인증 알고리즘"
                value={webAuth}
                onChange={setWebAuth}
                options={[{ value: 'sha256', label: 'SHA256' }, { value: 'digest', label: '다이제스트' }]}
              />
              <ToggleRow title="스트림 암호화" on={streamEncrypt} onToggle={() => setStreamEncrypt(!streamEncrypt)} />
            </div>
          </Card>

          {/* Row 2: DDNS(medium) | 포트(medium) */}
          <Card title="DDNS">
            <div className={page.formStack}>
              <ToggleRow title="DDNS 사용" on={ddnsOn} onToggle={() => setDdnsOn(!ddnsOn)} />
              <Kv label="DDNS 형식" value="S-1 DDNS" />
              <Kv label="서버 주소" value="apddnsdev.s1.co.kr" />
              <Kv label="포트" value="11001 ~ 11003" />
              <div className={page.formRow}>
                <span className={page.formLabel}>DDNS 상태</span>
                <Badge tone={ddnsOn ? 'success' : 'neutral'} dot>{ddnsOn ? '연결 성공' : '비활성'}</Badge>
              </div>
              <div className={page.settingsActions}>
                <div />
                <div className={page.settingsActionsRight}>
                  <Button variant="secondary" size="sm">연결 테스트</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="포트">
            <div className={page.formStack}>
              <div className={page.rowCols2}>
                <InputField label="HTTP 포트" value={httpPort} onChange={setHttpPort} />
                <InputField label="RTSP 포트" value={rtspPort} onChange={setRtspPort} />
              </div>
              <ToggleRow title="HTTPS 사용" on={httpsUse} onToggle={() => setHttpsUse(!httpsUse)} />
              {httpsUse && <InputField label="HTTPS 포트" value={httpsPort} onChange={setHttpsPort} />}
              <Seg
                label="포트 매핑 모드"
                value={portMapMode}
                onChange={setPortMapMode}
                options={[{ value: 'auto', label: '자동' }, { value: 'manual', label: '수동' }]}
              />
              <ToggleRow title="UPnP" on={upnp} onToggle={() => setUpnp(!upnp)} />
            </div>
          </Card>

        </div>
      )}

      {/* ===== 비디오 ===== */}
      {tab === 'video' && (
        <div className={cs.tabContentGrid}>
        <Card title="영상 스트림">
          <div className={page.formStack}>
            <Seg
              label="스트림 유형"
              value={streamSel}
              onChange={setStreamSel}
              options={[
                { value: 'main', label: '메인 스트림' },
                { value: 'sub1', label: '서브 스트림 1' },
                { value: 'sub2', label: '서브 스트림 2' },
              ]}
            />
            <SelectField label="해상도" value={cur.resolution} onChange={(v) => patchStream({ resolution: v })} options={RES_OPTIONS} />
            <Seg
              label="비트레이트 유형"
              value={cur.bitrateType}
              onChange={(v) => patchStream({ bitrateType: v })}
              options={[{ value: 'VBR', label: 'VBR' }, { value: 'CBR', label: 'CBR' }]}
            />
            <SelectField label="화질" value={cur.quality} onChange={(v) => patchStream({ quality: v })} options={QUALITY_OPTIONS} />
            <SelectField label="FPS (단위 5)" value={cur.fps} onChange={(v) => patchStream({ fps: v })} options={FPS_OPTIONS} />
            <Seg
              label="인코딩"
              value={cur.codec}
              onChange={(v) => patchStream({ codec: v })}
              options={[{ value: 'H.265', label: 'H.265' }, { value: 'H.264', label: 'H.264' }]}
            />
          </div>
        </Card>
        </div>
      )}


          </div>
        )}
      </div>
    </div>
  </div>
  );
}
