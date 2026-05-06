-- S1VaaS 초기 스키마 (V1)
-- 담당: s1vaas-backend-architect
-- 근거: s1vaas/assets/s1-cloud-viewer/src/App.jsx CONTRACTS 목데이터 역분석

CREATE SCHEMA IF NOT EXISTS s1vaas;
SET search_path TO s1vaas;

-- ENUM 타입
CREATE TYPE camera_status AS ENUM ('online','offline','alert','maintenance');
CREATE TYPE event_level  AS ENUM ('info','warning','danger');
CREATE TYPE user_role    AS ENUM ('admin','operator','monitor','inspector','readonly');
CREATE TYPE schedule_mode AS ENUM ('record_always','record_motion','record_schedule','disabled');

-- 계약 (contract)
CREATE TABLE contract (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code       VARCHAR(32) UNIQUE NOT NULL,
    name       VARCHAR(128) NOT NULL,
    company_id VARCHAR(64),
    start_date DATE NOT NULL,
    end_date   DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 사이트 (site) = 계약당 여러 지점
CREATE TABLE site (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    name        VARCHAR(128) NOT NULL,
    address     TEXT,
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    time_zone   VARCHAR(48) NOT NULL DEFAULT 'Asia/Seoul',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_site_contract ON site(contract_id);

-- 카메라 (camera) = 사이트당 여러 대
CREATE TABLE camera (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id           UUID NOT NULL REFERENCES site(id) ON DELETE CASCADE,
    name              VARCHAR(64) NOT NULL,
    location_label    VARCHAR(64),
    full_location     VARCHAR(256),
    ip                INET,
    model             VARCHAR(64),
    status            camera_status NOT NULL DEFAULT 'online',
    recording_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    resolution        VARCHAR(16),
    codec             VARCHAR(16),
    fps               INTEGER,
    bitrate_kbps      INTEGER,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_camera_site ON camera(site_id);
CREATE INDEX idx_camera_status ON camera(status);

-- 카메라 영역 (camera_zone) = 감지 구역 (가상펜스·출입금지·배회 등)
CREATE TABLE camera_zone (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES camera(id) ON DELETE CASCADE,
    zone_type VARCHAR(32) NOT NULL,  -- 'virtual_fence' | 'no_entry' | 'wander' | 'crowd'
    coords    JSONB NOT NULL,        -- [[x1,y1],[x2,y2],...]
    algo_id   VARCHAR(64),
    enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_zone_camera ON camera_zone(camera_id);

-- 사용자 (app_user; 'user' 는 예약어라 피함)
CREATE TABLE app_user (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(64) UNIQUE NOT NULL,
    display_name  VARCHAR(64) NOT NULL,
    role          user_role NOT NULL,
    email         VARCHAR(128),
    phone         VARCHAR(32),
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 이벤트 (event) = 이상감지·침입·배회 등
CREATE TABLE event (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id    UUID REFERENCES camera(id) ON DELETE CASCADE,
    type         VARCHAR(64) NOT NULL,   -- '침입감지'/'배회감지'/'화재감지'/...
    level        event_level NOT NULL DEFAULT 'info',
    message      TEXT,
    started_at   TIMESTAMPTZ NOT NULL,
    ended_at     TIMESTAMPTZ,
    snapshot_url TEXT
);
CREATE INDEX idx_event_started ON event(started_at DESC);
CREATE INDEX idx_event_camera  ON event(camera_id, started_at DESC);
CREATE INDEX idx_event_level   ON event(level) WHERE level != 'info';

-- 녹화 스케줄 (schedule) = 카메라당 요일·시간대별 설정
CREATE TABLE schedule (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id    UUID NOT NULL REFERENCES camera(id) ON DELETE CASCADE,
    weekday_mask SMALLINT NOT NULL,  -- bit0=Mon ... bit6=Sun
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    mode         schedule_mode NOT NULL DEFAULT 'record_always'
);
CREATE INDEX idx_schedule_camera ON schedule(camera_id);

-- 감사 로그 (audit_log)
CREATE TABLE audit_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES app_user(id),
    action        VARCHAR(64) NOT NULL,
    target_type   VARCHAR(32),
    target_id     VARCHAR(64),
    diff          JSONB,
    at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON audit_log(actor_user_id, at DESC);

-- ─── Seed 데이터 (handoff.md §§3~4 verbatim) ─────────────────────

INSERT INTO contract (code, name, start_date) VALUES
    ('N123456-1', '강남 본점',    '2024-01-01'),
    ('N123456-2', '서초 지점',    '2024-01-01'),
    ('N123456-3', '송파 지점',    '2024-03-01'),
    ('N123456-4', '판교 R&D센터', '2023-07-01'),
    ('N123456-5', '부산 지사',    '2024-02-01'),
    ('N123456-6', '제주 물류',    '2024-05-01');

INSERT INTO site (contract_id, name, address) VALUES
    ((SELECT id FROM contract WHERE code='N123456-1'), '강남 본점',    '서울특별시 강남구 테헤란로 521'),
    ((SELECT id FROM contract WHERE code='N123456-2'), '서초 지점',    '서울특별시 서초구 서초대로 74길 11'),
    ((SELECT id FROM contract WHERE code='N123456-3'), '송파 지점',    '서울특별시 송파구 올림픽로 300'),
    ((SELECT id FROM contract WHERE code='N123456-4'), '판교 R&D센터', '경기도 성남시 분당구 판교로 235'),
    ((SELECT id FROM contract WHERE code='N123456-5'), '부산 지사',    '부산광역시 해운대구 센텀중앙로 90'),
    ((SELECT id FROM contract WHERE code='N123456-6'), '제주 물류',    '제주특별자치도 제주시 첨단로 242');

INSERT INTO app_user (username, display_name, role, email) VALUES
    ('kim.admin',    '김관리',     'admin',    'kim.admin@s1.co.kr'),
    ('lee.op',       '이운영',     'operator', 'lee.op@s1.co.kr'),
    ('park.monitor', '박모니터',   'monitor',  'park.monitor@s1.co.kr'),
    ('jung.inspect', '정점검',     'inspector','jung.inspect@s1.co.kr'),
    ('choi.view',    '최관람',     'readonly', 'choi.view@s1.co.kr');
