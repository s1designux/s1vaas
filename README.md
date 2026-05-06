# s1vaas

S1 VaaS(Video as a Service) 클라우드 모니터링 시스템 목업.

- `frontend/` — React 19 + Vite 6 + TypeScript SPA (7 페이지)
- `backend/` — Spring Boot 3.4 + Java 21 + PostgreSQL (계약 도메인 v0.1)

## 빠른 실행 — 프론트엔드 목업만

```bash
cd s1vaas/frontend
npm install
npm run dev
```

→ http://localhost:5173/ (Safari)

로그인 페이지에서 아무 ID/PW 입력 후 진입 (mock auth).

## 빠른 실행 — 백엔드 (선택)

선행: JDK 21, PostgreSQL 14+ 로컬 기동.

```bash
# 1. DB 준비
psql postgres <<'SQL'
CREATE USER s1vaas WITH PASSWORD 's1vaas';
CREATE DATABASE s1vaas OWNER s1vaas;
SQL

# 2. Gradle wrapper (최초 1회)
cd s1vaas/backend
gradle wrapper --gradle-version 8.10

# 3. 부팅
./gradlew bootRun
```

→ http://localhost:8080/api/health

## 빌드

```bash
# 프론트엔드 정적 빌드
cd s1vaas/frontend && npm run build  # → dist/

# 백엔드 JAR
cd s1vaas/backend && ./gradlew bootJar  # → build/libs/*.jar
```
