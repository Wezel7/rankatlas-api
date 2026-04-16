-- RankAtlas MySQL Schema
-- Uitvoeren via Plesk > Databases > phpMyAdmin

CREATE DATABASE IF NOT EXISTS rankatlas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rankatlas;

-- Gebruikers
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(100),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projecten (bijv. hydrobag.nl)
CREATE TABLE IF NOT EXISTS projects (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  domain      VARCHAR(255) NOT NULL,
  name        VARCHAR(100),
  wp_api_url  VARCHAR(500),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Agents definitie (synchroon met ~/.claude/agents/*.md)
CREATE TABLE IF NOT EXISTS agents (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(100) NOT NULL UNIQUE,  -- bijv. 'technical-seo'
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(50),
  icon        VARCHAR(10),
  status      ENUM('idle','running','done','error') DEFAULT 'idle',
  last_run    DATETIME,
  last_action TEXT
);

-- Agent uitvoeringen (runs)
CREATE TABLE IF NOT EXISTS agent_runs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id    INT UNSIGNED NOT NULL,
  project_id  INT UNSIGNED,
  user_id     INT UNSIGNED NOT NULL,
  prompt      TEXT,
  result      LONGTEXT,
  status      ENUM('pending','running','done','error') DEFAULT 'pending',
  tokens_in   INT DEFAULT 0,
  tokens_out  INT DEFAULT 0,
  started_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME,
  FOREIGN KEY (agent_id)   REFERENCES agents(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id)    REFERENCES users(id)
);

-- Review inbox
CREATE TABLE IF NOT EXISTS reviews (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id  INT UNSIGNED,
  agent_run_id INT UNSIGNED,
  type        VARCHAR(50),   -- 'content', 'seo-change', 'publish', etc.
  title       VARCHAR(255),
  body        LONGTEXT,
  status      ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  FOREIGN KEY (project_id)   REFERENCES projects(id),
  FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id)
);

-- Keyword rankings
CREATE TABLE IF NOT EXISTS keywords (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id  INT UNSIGNED NOT NULL,
  keyword     VARCHAR(255) NOT NULL,
  position    INT,
  volume      INT,
  difficulty  INT,
  url         VARCHAR(500),
  tracked_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Metrics / KPIs per dag
CREATE TABLE IF NOT EXISTS metrics (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id   INT UNSIGNED NOT NULL,
  seo_score    INT,
  keywords_ranking INT,
  social_reach INT,
  leads        INT,
  recorded_at  DATE DEFAULT (CURDATE()),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Seed: standaard gebruiker (wachtwoord: 'changeme' — verander direct!)
INSERT IGNORE INTO users (email, password, name)
VALUES ('yorick@rankatlas.nl', '$2a$10$rQnJ9r3XvKZ2Wz1Y4mN8OeE8Kp5Lx7Mv2Nt3Ou4Pv5Qw6Rx7Sy8T', 'Yorick');

-- Seed: project hydrobag.nl
INSERT IGNORE INTO projects (user_id, domain, name, wp_api_url)
VALUES (1, 'hydrobag.nl', 'Hydrobag', 'https://www.hydrobag.nl/wp-json/wp/v2/');

-- Seed: alle 24 agents
INSERT IGNORE INTO agents (slug, name, category, icon, status) VALUES
('orchestrator',      'Orchestrator',       'Core',       '🧠', 'idle'),
('technical-seo',     'Technical SEO',      'SEO',        '⚙️', 'idle'),
('keyword-rankings',  'Keywords & Rankings','SEO',        '📊', 'idle'),
('analytics',         'Analytics',          'Data',       '📈', 'idle'),
('content-plan',      'Content Plan',       'Content',    '📅', 'idle'),
('backlinks',         'Backlinks',          'SEO',        '🔗', 'idle'),
('geo-audit',         'GEO Audit',          'AI Search',  '🌍', 'idle'),
('llm-visibility',    'LLM Visibility',     'AI Search',  '🤖', 'idle'),
('reddit',            'Reddit',             'Social',     '👾', 'idle'),
('content-researcher','Content Researcher', 'Content',    '🔍', 'idle'),
('content',           'Content',            'Content',    '✍️', 'idle'),
('social',            'Social',             'Social',     '📱', 'idle'),
('planner',           'Planner',            'Core',       '🗓️', 'idle'),
('publisher',         'Publisher',          'Core',       '🚀', 'idle'),
('dm-lead',           'DM Lead',            'Outreach',   '💬', 'idle'),
('competitor',        'Competitor',         'Analysis',   '🕵️', 'idle'),
('news',              'News',               'Content',    '📰', 'idle'),
('social-analytics',  'Social Analytics',   'Data',       '📊', 'idle'),
('brand-developer',   'Brand Developer',    'Brand',      '🎨', 'idle'),
('ads',               'Ads',                'Paid',       '💰', 'idle'),
('email-outreach',    'Email Outreach',     'Outreach',   '📧', 'idle'),
('review',            'Review',             'Core',       '✅', 'idle'),
('website-chat',      'Website Chat',       'Engagement', '💭', 'idle'),
('rapportage',        'Rapportage',         'Data',       '📋', 'idle'),
('trend',             'Trend',              'Data',       '📡', 'idle'),
('website-builder',   'Website Builder',    'Core',       '🏗️', 'idle');
