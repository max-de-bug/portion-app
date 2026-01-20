-- X402 V2 Database Migration
-- Run this migration to add the required tables for X402 V2 features
-- Execute: psql -d your_database -f 001_x402_v2.sql

-- ============================================
-- Sessions table - stores authenticated wallet sessions
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    nonce TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    revoked_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_wallet ON sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- Nonces table - for replay protection
-- ============================================
CREATE TABLE IF NOT EXISTS nonces (
    nonce TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nonces_wallet ON nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nonces_expires ON nonces(expires_at);

-- ============================================
-- Prepaid balances table - stores user prepaid USD balances
-- ============================================
CREATE TABLE IF NOT EXISTS prepaid_balances (
    wallet_address TEXT PRIMARY KEY,
    balance DECIMAL(18, 6) NOT NULL DEFAULT 0,
    last_topup TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- Prepaid transactions table - audit trail for all prepaid operations
-- ============================================
CREATE TABLE IF NOT EXISTS prepaid_transactions (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('topup', 'deduction', 'refund')),
    amount DECIMAL(18, 6) NOT NULL,
    service_id TEXT,
    payment_tx TEXT,
    balance_after DECIMAL(18, 6) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prepaid_tx_wallet ON prepaid_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_prepaid_tx_timestamp ON prepaid_transactions(timestamp);

-- ============================================
-- Usage metrics table - tracks all service usage for analytics and billing
-- ============================================
CREATE TABLE IF NOT EXISTS usage_metrics (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    service_id TEXT NOT NULL,
    payment_scheme TEXT NOT NULL,
    amount DECIMAL(18, 6),
    session_id TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_usage_wallet ON usage_metrics(wallet_address);
CREATE INDEX IF NOT EXISTS idx_usage_service ON usage_metrics(service_id);
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_metrics(timestamp);

-- ============================================
-- Update ai_services table with new columns
-- ============================================
ALTER TABLE ai_services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE ai_services ADD COLUMN IF NOT EXISTS pricing_scheme TEXT DEFAULT 'pay-per-use';
ALTER TABLE ai_services ADD COLUMN IF NOT EXISTS prepaid_discount INTEGER DEFAULT 0;

-- ============================================
-- Add some default prepaid discounts to existing services
-- ============================================
UPDATE ai_services SET prepaid_discount = 10 WHERE id = 'gpt-4';
UPDATE ai_services SET prepaid_discount = 10 WHERE id = 'gpt-4-turbo';
UPDATE ai_services SET prepaid_discount = 10 WHERE id = 'claude-3';
UPDATE ai_services SET prepaid_discount = 5 WHERE id = 'dall-e-3';
UPDATE ai_services SET prepaid_discount = 5 WHERE id = 'whisper';
UPDATE ai_services SET prepaid_discount = 5 WHERE id = 'web-search';

-- Set categories
UPDATE ai_services SET category = 'text-generation' WHERE id IN ('gpt-4', 'gpt-4-turbo', 'claude-3');
UPDATE ai_services SET category = 'image-generation' WHERE id = 'dall-e-3';
UPDATE ai_services SET category = 'audio' WHERE id = 'whisper';
UPDATE ai_services SET category = 'search' WHERE id = 'web-search';

-- ============================================
-- Cleanup job (optional - run periodically)
-- ============================================
-- DELETE FROM sessions WHERE expires_at < NOW() AND revoked_at IS NOT NULL;
-- DELETE FROM nonces WHERE expires_at < NOW();
