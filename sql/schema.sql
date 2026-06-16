-- CAMS Morning Watch — Neon DB 스키마
-- Neon SQL Editor에서 1회 실행

CREATE TABLE prices (
  date    date NOT NULL,
  metric  text NOT NULL,            -- 'hyundai' | 'kia' | 'usdkrw' | 'wti'
  value   numeric(10,2) NOT NULL,
  PRIMARY KEY (date, metric)
);

CREATE TABLE news (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pub_date  date NOT NULL,
  keyword   text NOT NULL,
  title     text NOT NULL,
  link      text NOT NULL UNIQUE,   -- 중복 수집 방지
  source    text
);

CREATE INDEX idx_news_date ON news (pub_date DESC);

-- AI 일일 브리핑 (cron에서 1일 1회 생성, 같은 날짜 재실행 시 갱신)
CREATE TABLE briefings (
  date    date PRIMARY KEY,
  content text NOT NULL,
  model   text
);
