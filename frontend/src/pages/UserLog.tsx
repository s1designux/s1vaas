import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataListTable } from '@/components/ui/DataListTable';
import { TopSearch } from '@/components/ui/TopSearch';
import styles from './UserLog.module.css';

type LogAction =
  | '로그인' | '로그아웃' | '카메라 조회' | '카메라 설정 변경'
  | '사용자 추가' | '사용자 수정' | '사용자 삭제'
  | '알림 확인' | '데이터 내보내기' | '사이트 설정 변경';
type LogResult = '성공' | '실패';
type UserRole = '관리자' | '보안관리자' | '운영자' | '조회전용';

interface LogEntry {
  id: number;
  time: string;
  user: string;
  role: UserRole;
  action: LogAction;
  target: string;
  ip: string;
  result: LogResult;
}

const MOCK_LOGS: LogEntry[] = [
  { id: 1,  time: '2026-05-07 09:12:34', user: '홍길동', role: '관리자',    action: '로그인',          target: '시스템',                          ip: '192.168.1.45',  result: '성공' },
  { id: 2,  time: '2026-05-07 09:15:22', user: '홍길동', role: '관리자',    action: '카메라 설정 변경', target: '강남 본점 · 카메라 #3',            ip: '192.168.1.45',  result: '성공' },
  { id: 3,  time: '2026-05-07 09:20:11', user: '김보안', role: '보안관리자', action: '로그인',          target: '시스템',                          ip: '10.10.2.88',    result: '성공' },
  { id: 4,  time: '2026-05-07 09:25:03', user: '이운영', role: '운영자',    action: '로그인',          target: '시스템',                          ip: '172.16.0.12',   result: '실패' },
  { id: 5,  time: '2026-05-07 09:25:47', user: '이운영', role: '운영자',    action: '로그인',          target: '시스템',                          ip: '172.16.0.12',   result: '성공' },
  { id: 6,  time: '2026-05-07 09:31:08', user: '홍길동', role: '관리자',    action: '사용자 추가',      target: '박조회 (조회전용)',                ip: '192.168.1.45',  result: '성공' },
  { id: 7,  time: '2026-05-07 09:44:19', user: '김보안', role: '보안관리자', action: '카메라 조회',     target: '서초 지점 · 카메라 #1',            ip: '10.10.2.88',    result: '성공' },
  { id: 8,  time: '2026-05-07 10:02:55', user: '이운영', role: '운영자',    action: '알림 확인',        target: '알림 #1042 — 침입 감지',           ip: '172.16.0.12',   result: '성공' },
  { id: 9,  time: '2026-05-07 10:15:30', user: '박조회', role: '조회전용',  action: '카메라 조회',     target: '강남 본점 · 카메라 #2',            ip: '192.168.5.21',  result: '성공' },
  { id: 10, time: '2026-05-07 10:22:41', user: '홍길동', role: '관리자',    action: '사이트 설정 변경', target: '판교 R&D 센터',                   ip: '192.168.1.45',  result: '성공' },
  { id: 11, time: '2026-05-07 10:33:12', user: '김보안', role: '보안관리자', action: '데이터 내보내기', target: '알림 목록 (2026-05-01 ~ 05-07)',   ip: '10.10.2.88',    result: '성공' },
  { id: 12, time: '2026-05-07 11:01:07', user: '이운영', role: '운영자',    action: '카메라 조회',     target: '송파 지점 · 카메라 #5',            ip: '172.16.0.12',   result: '성공' },
  { id: 13, time: '2026-05-07 11:14:28', user: '홍길동', role: '관리자',    action: '사용자 수정',      target: '이운영 — 권한 변경',               ip: '192.168.1.45',  result: '성공' },
  { id: 14, time: '2026-05-07 11:30:55', user: '박조회', role: '조회전용',  action: '카메라 조회',     target: '부산 지사 · 카메라 #1',            ip: '192.168.5.21',  result: '성공' },
  { id: 15, time: '2026-05-07 11:45:02', user: '김보안', role: '보안관리자', action: '알림 확인',       target: '알림 #1043 — 야간 활동',           ip: '10.10.2.88',    result: '성공' },
  { id: 16, time: '2026-05-07 12:00:33', user: '이운영', role: '운영자',    action: '로그아웃',         target: '시스템',                          ip: '172.16.0.12',   result: '성공' },
  { id: 17, time: '2026-05-07 12:20:44', user: '홍길동', role: '관리자',    action: '카메라 설정 변경', target: '제주 물류센터 · 카메라 #7',        ip: '192.168.1.45',  result: '성공' },
  { id: 18, time: '2026-05-07 13:05:19', user: '박조회', role: '조회전용',  action: '카메라 설정 변경', target: '강남 본점 · 카메라 #1',            ip: '192.168.5.21',  result: '실패' },
  { id: 19, time: '2026-05-07 13:22:08', user: '김보안', role: '보안관리자', action: '사용자 삭제',     target: '테스트계정 (운영자)',              ip: '10.10.2.88',    result: '성공' },
  { id: 20, time: '2026-05-07 13:40:50', user: '홍길동', role: '관리자',    action: '데이터 내보내기', target: '사용자 로그 (2026-05-01 ~ 05-07)', ip: '192.168.1.45',  result: '성공' },
  { id: 21, time: '2026-05-07 14:01:37', user: '이운영', role: '운영자',    action: '로그인',          target: '시스템',                          ip: '172.16.0.55',   result: '성공' },
  { id: 22, time: '2026-05-07 14:15:22', user: '이운영', role: '운영자',    action: '카메라 조회',     target: '강남 본점 · 카메라 #4',            ip: '172.16.0.55',   result: '성공' },
  { id: 23, time: '2026-05-07 14:28:09', user: '박조회', role: '조회전용',  action: '알림 확인',        target: '알림 #1044 — 화재 감지',           ip: '192.168.5.21',  result: '성공' },
  { id: 24, time: '2026-05-07 14:52:44', user: '홍길동', role: '관리자',    action: '사이트 설정 변경', target: '강남 본점',                        ip: '192.168.1.45',  result: '성공' },
  { id: 25, time: '2026-05-07 15:10:01', user: '김보안', role: '보안관리자', action: '로그아웃',        target: '시스템',                          ip: '10.10.2.88',    result: '성공' },
  { id: 26, time: '2026-05-07 15:30:18', user: '이운영', role: '운영자',    action: '알림 확인',        target: '알림 #1045 — 미등록 인원',         ip: '172.16.0.55',   result: '성공' },
  { id: 27, time: '2026-05-07 15:48:33', user: '홍길동', role: '관리자',    action: '카메라 조회',     target: '부산 지사 · 카메라 #3',            ip: '192.168.1.45',  result: '성공' },
  { id: 28, time: '2026-05-07 16:05:52', user: '박조회', role: '조회전용',  action: '로그아웃',         target: '시스템',                          ip: '192.168.5.21',  result: '성공' },
  { id: 29, time: '2026-05-07 16:22:14', user: '이운영', role: '운영자',    action: '카메라 설정 변경', target: '서초 지점 · 카메라 #2',            ip: '172.16.0.55',   result: '실패' },
  { id: 30, time: '2026-05-07 16:45:09', user: '홍길동', role: '관리자',    action: '로그아웃',         target: '시스템',                          ip: '192.168.1.45',  result: '성공' },
];

const SITES   = ['강남 본점', '서초 지점', '송파 지점', '판교 R&D 센터', '부산 지사', '제주 물류센터'];
const ACTIONS: LogAction[] = [
  '로그인', '로그아웃', '카메라 조회', '카메라 설정 변경',
  '사용자 추가', '사용자 수정', '사용자 삭제',
  '알림 확인', '데이터 내보내기', '사이트 설정 변경',
];
const ROLE_TONE: Record<UserRole, 'danger' | 'warn' | 'info' | 'neutral'> = {
  '관리자':    'danger',
  '보안관리자': 'warn',
  '운영자':    'info',
  '조회전용':  'neutral',
};

const PAGE_SIZE_OPTIONS = [15, 30, 50];

export default function UserLog() {
  const [from,          setFrom]          = useState('');
  const [to,            setTo]            = useState('');
  const [userInput,     setUserInput]     = useState('');
  const [actionFilter,  setActionFilter]  = useState('');
  const [siteFilter,    setSiteFilter]    = useState('');

  const [query, setQuery] = useState({ from: '', to: '', user: '', action: '', site: '' });

  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handleSearch = () => {
    setPage(1);
    setQuery({ from, to, user: userInput, action: actionFilter, site: siteFilter });
  };

  const handleReset = () => {
    setFrom(''); setTo(''); setUserInput(''); setActionFilter(''); setSiteFilter('');
    setQuery({ from: '', to: '', user: '', action: '', site: '' });
    setPage(1);
  };

  const filtered = MOCK_LOGS.filter((log) => {
    if (query.user   && !log.user.includes(query.user))           return false;
    if (query.action && log.action !== query.action)              return false;
    if (query.site   && !log.target.includes(query.site))         return false;
    if (query.from   && log.time < query.from)                    return false;
    if (query.to     && log.time > query.to + ' 23:59:59')        return false;
    return true;
  });

  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <div className={styles.page}>
      {/* ── Filter bar ── */}
      <div className={styles.filterWrap}>
        <TopSearch
          onSubmit={handleSearch}
          buttons={
            <>
              <button type="button" className={styles.resetBtn} onClick={handleReset}>초기화</button>
              <button type="button" className={styles.searchBtn} onClick={handleSearch}>검색</button>
            </>
          }
        >
          <TopSearch.Row>
            <TopSearch.Field label="기간" wide>
              <TopSearch.DateRange>
                <input
                  type="date"
                  className={styles.filterDate}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  aria-label="시작일"
                />
                <TopSearch.Between />
                <input
                  type="date"
                  className={styles.filterDate}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-label="종료일"
                />
              </TopSearch.DateRange>
            </TopSearch.Field>
            <TopSearch.Field label="사용자">
              <input
                type="text"
                className={styles.filterInput}
                placeholder="이름 검색"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
            </TopSearch.Field>
            <TopSearch.Divider />
            <TopSearch.Field label="액션">
              <select
                className={styles.filterSelect}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">전체</option>
                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </TopSearch.Field>
            <TopSearch.Field label="사이트">
              <select
                className={styles.filterSelect}
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
              >
                <option value="">전체</option>
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </TopSearch.Field>
          </TopSearch.Row>
        </TopSearch>
      </div>

      {/* ── DataListTable ── */}
      <div className={styles.tableCard}>
      <DataListTable>
        <DataListTable.Table>
          <table>
            <colgroup>
              <col style={{ width: 48 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 104 }} />
              <col style={{ width: 144 }} />
              <col />
              <col style={{ width: 134 }} />
              <col style={{ width: 72 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>No.</th>
                <th style={{ textAlign: 'left' }}>시각</th>
                <th style={{ textAlign: 'left' }}>사용자</th>
                <th>역할</th>
                <th style={{ textAlign: 'left' }}>액션 유형</th>
                <th style={{ textAlign: 'left' }}>대상</th>
                <th style={{ textAlign: 'left' }}>IP 주소</th>
                <th>결과</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((log) => (
                <tr key={log.id}>
                  <td className={styles.tdMuted}>{log.id}</td>
                  <td className={styles.tdMono}>{log.time}</td>
                  <td className={styles.tdBold}>{log.user}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge tone={ROLE_TONE[log.role]}>{log.role}</Badge>
                  </td>
                  <td>{log.action}</td>
                  <td className={styles.tdTarget}>{log.target}</td>
                  <td className={styles.tdMono}>{log.ip}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge tone={log.result === '성공' ? 'success' : 'danger'}>
                      {log.result}
                    </Badge>
                  </td>
                </tr>
              )) : (
                <DataListTable.EmptyRow colSpan={8} message="검색 결과가 없습니다." />
              )}
            </tbody>
          </table>
        </DataListTable.Table>
        <DataListTable.Footer
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        >
          <DataListTable.Pagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onChange={setPage}
          />
        </DataListTable.Footer>
      </DataListTable>
      </div>
    </div>
  );
}
