-- Create shop-related tables for production deployment

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
    id VARCHAR(255) PRIMARY KEY,
    shop_domain VARCHAR(255) NOT NULL UNIQUE,
    access_token TEXT NOT NULL, -- encrypted
    scope TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    installed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Shop settings table
CREATE TABLE IF NOT EXISTS shop_settings (
    id VARCHAR(255) PRIMARY KEY,
    shop_id VARCHAR(255) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Search & Filter settings
    enable_ai_search BOOLEAN DEFAULT true,
    enable_advanced_filters BOOLEAN DEFAULT true,
    enable_recommendations BOOLEAN DEFAULT true,
    
    -- UI customization
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#666666',
    font_family VARCHAR(100) DEFAULT 'system-ui',
    border_radius VARCHAR(10) DEFAULT '4px',
    
    -- Feature flags
    enable_preorders BOOLEAN DEFAULT false,
    enable_real_time_sync BOOLEAN DEFAULT true,
    enable_analytics BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    UNIQUE(shop_id)
);

-- Install sessions table (for OAuth flow)
CREATE TABLE IF NOT EXISTS install_sessions (
    id VARCHAR(255) PRIMARY KEY,
    shop_domain VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL UNIQUE,
    hmac VARCHAR(255) NOT NULL,
    timestamp VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shops_domain ON shops(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shops_active ON shops(is_active);
CREATE INDEX IF NOT EXISTS idx_shops_installed_at ON shops(installed_at);

CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id ON shop_settings(shop_id);

CREATE INDEX IF NOT EXISTS idx_install_sessions_shop_domain ON install_sessions(shop_domain);
CREATE INDEX IF NOT EXISTS idx_install_sessions_state ON install_sessions(state);
CREATE INDEX IF NOT EXISTS idx_install_sessions_expires_at ON install_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_install_sessions_completed ON install_sessions(is_completed);

-- Add cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM install_sessions 
    WHERE expires_at < NOW() AND is_completed = false;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if using PostgreSQL with pg_cron)
-- SELECT cron.schedule('cleanup-sessions', '*/5 * * * *', 'SELECT cleanup_expired_sessions();');
