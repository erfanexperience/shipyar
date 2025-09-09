-- Shippyar MVP Database Schema
-- PostgreSQL DDL for people-powered delivery marketplace

-- Extensions for enhanced functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Custom types for better data integrity
CREATE TYPE user_role AS ENUM ('shopper', 'traveler', 'both', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deactivated', 'pending_verification');
CREATE TYPE order_status AS ENUM ('draft', 'active', 'matched', 'purchased', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed');
CREATE TYPE offer_status AS ENUM ('active', 'withdrawn', 'accepted', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'refunded', 'failed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('order_payment', 'platform_fee', 'traveler_payout', 'refund', 'dispute_resolution');
CREATE TYPE message_type AS ENUM ('text', 'image', 'document', 'system', 'location');
CREATE TYPE notification_type AS ENUM ('order_update', 'new_offer', 'payment', 'message', 'review', 'system');
CREATE TYPE verification_type AS ENUM ('email', 'phone', 'identity', 'payment_method');
CREATE TYPE dispute_status AS ENUM ('open', 'investigating', 'resolved', 'closed');

-- =============================================================================
-- USERS AND AUTHENTICATION
-- =============================================================================

-- Core users table with dual role support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'both',
    status user_status NOT NULL DEFAULT 'pending_verification',
    
    -- Profile information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    
    -- Location data
    primary_country VARCHAR(2), -- ISO country code
    primary_city VARCHAR(100),
    timezone VARCHAR(50),
    
    -- Verification flags
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT FALSE,
    payment_verified BOOLEAN DEFAULT FALSE,
    
    -- Preferences
    preferred_language VARCHAR(5) DEFAULT 'en',
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Ratings and stats
    shopper_rating DECIMAL(3,2) DEFAULT 0.00,
    shopper_review_count INTEGER DEFAULT 0,
    traveler_rating DECIMAL(3,2) DEFAULT 0.00,
    traveler_review_count INTEGER DEFAULT 0,
    total_orders_as_shopper INTEGER DEFAULT 0,
    total_orders_as_traveler INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_rating_check CHECK (
        shopper_rating >= 0 AND shopper_rating <= 5 AND
        traveler_rating >= 0 AND traveler_rating <= 5
    )
);

-- User sessions for authentication
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User verification records
CREATE TABLE user_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type verification_type NOT NULL,
    verification_data JSONB, -- Store verification details
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- GEOGRAPHIC AND LOCATION DATA
-- =============================================================================

-- Countries for standardized location handling
CREATE TABLE countries (
    code VARCHAR(2) PRIMARY KEY, -- ISO 3166-1 alpha-2
    name VARCHAR(100) NOT NULL,
    currency VARCHAR(3), -- ISO 4217
    phone_prefix VARCHAR(10),
    enabled BOOLEAN DEFAULT TRUE
);

-- Cities with geographic coordinates
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location POINT, -- PostGIS point for efficient spatial queries
    timezone VARCHAR(50),
    enabled BOOLEAN DEFAULT TRUE,
    
    UNIQUE(name, country_code)
);

-- =============================================================================
-- ORDERS AND MARKETPLACE
-- =============================================================================

-- Core orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopper_id UUID NOT NULL REFERENCES users(id),
    
    -- Product information
    product_name VARCHAR(255) NOT NULL,
    product_url TEXT NOT NULL,
    product_description TEXT,
    product_image_url TEXT,
    product_price DECIMAL(10, 2),
    product_currency VARCHAR(3) DEFAULT 'USD',
    quantity INTEGER DEFAULT 1,
    
    -- Delivery details
    destination_country VARCHAR(2) NOT NULL REFERENCES countries(code),
    destination_city_id UUID REFERENCES cities(id),
    destination_address TEXT,
    destination_coordinates POINT,
    
    -- Timing
    deadline_date DATE NOT NULL,
    preferred_delivery_date DATE,
    
    -- Pricing
    reward_amount DECIMAL(10, 2) NOT NULL,
    reward_currency VARCHAR(3) DEFAULT 'USD',
    platform_fee DECIMAL(10, 2),
    total_cost DECIMAL(10, 2) NOT NULL, -- reward + platform fee
    
    -- Status and metadata
    status order_status NOT NULL DEFAULT 'draft',
    special_instructions TEXT,
    weight_estimate DECIMAL(5, 2), -- in kg
    size_description VARCHAR(100),
    
    -- Matching
    matched_traveler_id UUID REFERENCES users(id),
    matched_at TIMESTAMP WITH TIME ZONE,
    
    -- Completion tracking
    purchased_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT orders_positive_amounts CHECK (
        reward_amount > 0 AND 
        total_cost > 0 AND 
        (platform_fee IS NULL OR platform_fee >= 0)
    ),
    CONSTRAINT orders_dates_check CHECK (
        deadline_date >= CURRENT_DATE AND
        (preferred_delivery_date IS NULL OR preferred_delivery_date >= CURRENT_DATE)
    )
);

-- Offers from travelers
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    traveler_id UUID NOT NULL REFERENCES users(id),
    
    -- Offer details
    message TEXT,
    proposed_delivery_date DATE,
    travel_route JSONB, -- Array of cities/countries on route
    
    -- Status
    status offer_status NOT NULL DEFAULT 'active',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(order_id, traveler_id),
    CONSTRAINT offers_future_delivery CHECK (proposed_delivery_date >= CURRENT_DATE)
);

-- Order status history for audit trail
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status order_status,
    new_status order_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PAYMENTS AND TRANSACTIONS
-- =============================================================================

-- Payment methods for users
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Payment provider data (encrypted)
    provider VARCHAR(50) NOT NULL, -- stripe, paypal, etc.
    provider_payment_method_id VARCHAR(255) NOT NULL,
    
    -- Display information
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    expires_month INTEGER,
    expires_year INTEGER,
    
    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Core transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Related entities
    order_id UUID REFERENCES orders(id),
    payer_id UUID REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    payment_method_id UUID REFERENCES payment_methods(id),
    
    -- Transaction details
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'pending',
    
    -- Payment provider integration
    provider VARCHAR(50), -- stripe, paypal, etc.
    provider_transaction_id VARCHAR(255),
    provider_metadata JSONB,
    
    -- Fees and breakdown
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    processing_fee DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2),
    
    -- Timing
    authorized_at TIMESTAMP WITH TIME ZONE,
    captured_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    failure_reason TEXT,
    failure_code VARCHAR(50),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT transactions_positive_amount CHECK (amount > 0)
);

-- Escrow holdings for order payments
CREATE TABLE escrow_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Release conditions
    auto_release_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    released_by UUID REFERENCES users(id),
    release_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MESSAGING AND COMMUNICATION
-- =============================================================================

-- Chat conversations between users
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shopper_id UUID NOT NULL REFERENCES users(id),
    traveler_id UUID NOT NULL REFERENCES users(id),
    
    -- Access control
    unlocked_at TIMESTAMP WITH TIME ZONE, -- Unlocked after payment
    
    -- Status
    is_archived BOOLEAN DEFAULT FALSE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(order_id, shopper_id, traveler_id)
);

-- Individual messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    
    -- Message content
    message_type message_type NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    metadata JSONB, -- For location, file info, etc.
    
    -- Status
    read_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- REVIEWS AND RATINGS
-- =============================================================================

-- Reviews between users after order completion
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    
    -- Review type based on roles
    reviewer_role user_role NOT NULL,
    
    -- Status
    is_public BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified purchase/delivery
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(order_id, reviewer_id, reviewee_id)
);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

-- User notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification channels
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    
    -- Notification types
    order_updates BOOLEAN DEFAULT TRUE,
    new_offers BOOLEAN DEFAULT TRUE,
    payment_updates BOOLEAN DEFAULT TRUE,
    messages BOOLEAN DEFAULT TRUE,
    reviews BOOLEAN DEFAULT TRUE,
    marketing BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Notification logs
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    order_id UUID REFERENCES orders(id),
    conversation_id UUID REFERENCES conversations(id),
    
    -- Delivery channels
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,
    sent_via_sms BOOLEAN DEFAULT FALSE,
    
    -- Status
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for user notifications feed
    INDEX CONCURRENTLY idx_notifications_user_created (user_id, created_at DESC)
);

-- =============================================================================
-- DISPUTES AND SUPPORT
-- =============================================================================

-- Dispute resolution system
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    filed_by UUID NOT NULL REFERENCES users(id),
    
    -- Dispute details
    reason VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    evidence_urls JSONB, -- Array of evidence file URLs
    
    -- Resolution
    status dispute_status NOT NULL DEFAULT 'open',
    assigned_to UUID REFERENCES users(id), -- Admin/support agent
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PRODUCT INFORMATION CACHING
-- =============================================================================

-- Cache product information from external URLs
CREATE TABLE product_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 of normalized URL
    original_url TEXT NOT NULL,
    
    -- Cached product data
    title VARCHAR(500),
    description TEXT,
    price DECIMAL(10, 2),
    currency VARCHAR(3),
    image_url TEXT,
    availability VARCHAR(50),
    
    -- Metadata
    site_name VARCHAR(100),
    scraped_data JSONB, -- Raw scraped data
    
    -- Cache management
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    fetch_count INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- AUDIT AND LOGGING
-- =============================================================================

-- System audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor information
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES user_sessions(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    context JSONB, -- Additional context like order_id, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data retention policies
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    retention_days INTEGER NOT NULL,
    delete_strategy VARCHAR(50) NOT NULL, -- 'soft_delete', 'hard_delete', 'archive'
    last_cleanup_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users table indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_users_location ON users(primary_country, primary_city) WHERE deleted_at IS NULL;

-- Orders table indexes
CREATE INDEX CONCURRENTLY idx_orders_shopper ON orders(shopper_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_orders_traveler ON orders(matched_traveler_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_orders_destination ON orders(destination_country, destination_city_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_orders_deadline ON orders(deadline_date) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_orders_created ON orders(created_at DESC) WHERE deleted_at IS NULL;

-- Geographic indexes
CREATE INDEX CONCURRENTLY idx_cities_location ON cities USING GIST(location) WHERE enabled = TRUE;
CREATE INDEX CONCURRENTLY idx_cities_country ON cities(country_code) WHERE enabled = TRUE;

-- Offers table indexes
CREATE INDEX CONCURRENTLY idx_offers_order ON offers(order_id);
CREATE INDEX CONCURRENTLY idx_offers_traveler ON offers(traveler_id);
CREATE INDEX CONCURRENTLY idx_offers_status ON offers(status);
CREATE INDEX CONCURRENTLY idx_offers_created ON offers(created_at DESC);

-- Transactions indexes
CREATE INDEX CONCURRENTLY idx_transactions_order ON transactions(order_id);
CREATE INDEX CONCURRENTLY idx_transactions_payer ON transactions(payer_id);
CREATE INDEX CONCURRENTLY idx_transactions_recipient ON transactions(recipient_id);
CREATE INDEX CONCURRENTLY idx_transactions_status ON transactions(status);
CREATE INDEX CONCURRENTLY idx_transactions_type ON transactions(transaction_type);
CREATE INDEX CONCURRENTLY idx_transactions_created ON transactions(created_at DESC);

-- Messages and conversations
CREATE INDEX CONCURRENTLY idx_conversations_order ON conversations(order_id);
CREATE INDEX CONCURRENTLY idx_conversations_participants ON conversations(shopper_id, traveler_id);
CREATE INDEX CONCURRENTLY idx_messages_conversation ON messages(conversation_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_messages_sender ON messages(sender_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_messages_created ON messages(created_at DESC) WHERE deleted_at IS NULL;

-- Reviews indexes
CREATE INDEX CONCURRENTLY idx_reviews_order ON reviews(order_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_reviews_reviewee ON reviews(reviewee_id) WHERE deleted_at IS NULL AND is_public = TRUE;
CREATE INDEX CONCURRENTLY idx_reviews_created ON reviews(created_at DESC) WHERE deleted_at IS NULL;

-- Product cache indexes
CREATE INDEX CONCURRENTLY idx_product_cache_url_hash ON product_cache(url_hash);
CREATE INDEX CONCURRENTLY idx_product_cache_expires ON product_cache(expires_at);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_orders_search ON orders USING GIN(to_tsvector('english', product_name || ' ' || COALESCE(product_description, ''))) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_users_search ON users USING GIN(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(display_name, ''))) WHERE deleted_at IS NULL;

-- =============================================================================
-- TRIGGERS FOR AUDIT TRAILS AND SOFT DELETES
-- =============================================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        CURRENT_TIMESTAMP
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Function to update user ratings when reviews are added/updated
CREATE OR REPLACE FUNCTION update_user_ratings()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calculate new rating for the reviewee
    SELECT 
        ROUND(AVG(rating), 2),
        COUNT(*)
    INTO avg_rating, review_count
    FROM reviews 
    WHERE reviewee_id = NEW.reviewee_id 
    AND deleted_at IS NULL 
    AND is_public = TRUE;
    
    -- Update user ratings based on their role in the review
    IF NEW.reviewer_role = 'shopper' THEN
        -- Shopper reviewing traveler
        UPDATE users 
        SET 
            traveler_rating = COALESCE(avg_rating, 0),
            traveler_review_count = review_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.reviewee_id;
    ELSE
        -- Traveler reviewing shopper
        UPDATE users 
        SET 
            shopper_rating = COALESCE(avg_rating, 0),
            shopper_review_count = review_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.reviewee_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ratings_on_review AFTER INSERT OR UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_user_ratings();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert common countries
INSERT INTO countries (code, name, currency, phone_prefix) VALUES
('US', 'United States', 'USD', '+1'),
('CA', 'Canada', 'CAD', '+1'),
('GB', 'United Kingdom', 'GBP', '+44'),
('FR', 'France', 'EUR', '+33'),
('DE', 'Germany', 'EUR', '+49'),
('JP', 'Japan', 'JPY', '+81'),
('AU', 'Australia', 'AUD', '+61'),
('CN', 'China', 'CNY', '+86'),
('IN', 'India', 'INR', '+91'),
('BR', 'Brazil', 'BRL', '+55');

-- Insert major cities (sample data)
INSERT INTO cities (name, country_code, latitude, longitude, timezone) VALUES
('New York', 'US', 40.7128, -74.0060, 'America/New_York'),
('Los Angeles', 'US', 34.0522, -118.2437, 'America/Los_Angeles'),
('Chicago', 'US', 41.8781, -87.6298, 'America/Chicago'),
('Toronto', 'CA', 43.6532, -79.3832, 'America/Toronto'),
('London', 'GB', 51.5074, -0.1278, 'Europe/London'),
('Paris', 'FR', 48.8566, 2.3522, 'Europe/Paris'),
('Berlin', 'DE', 52.5200, 13.4050, 'Europe/Berlin'),
('Tokyo', 'JP', 35.6762, 139.6503, 'Asia/Tokyo'),
('Sydney', 'AU', -33.8688, 151.2093, 'Australia/Sydney'),
('Mumbai', 'IN', 19.0760, 72.8777, 'Asia/Kolkata');

-- Update location points for cities
UPDATE cities SET location = POINT(longitude, latitude);

-- Insert default data retention policies
INSERT INTO data_retention_policies (table_name, retention_days, delete_strategy) VALUES
('audit_logs', 2555, 'hard_delete'), -- 7 years for financial records
('user_sessions', 90, 'hard_delete'),
('password_reset_tokens', 30, 'hard_delete'),
('notifications', 365, 'hard_delete'),
('product_cache', 30, 'hard_delete'),
('messages', 2555, 'soft_delete'), -- 7 years but soft delete for disputes
('order_status_history', 2555, 'archive');

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active orders view with location and user details
CREATE VIEW active_orders_view AS
SELECT 
    o.id,
    o.product_name,
    o.reward_amount,
    o.reward_currency,
    o.deadline_date,
    o.status,
    o.created_at,
    
    -- Shopper info
    s.first_name as shopper_first_name,
    s.last_name as shopper_last_name,
    s.shopper_rating,
    
    -- Location info
    c.name as destination_city,
    ct.name as destination_country,
    
    -- Offer count
    (SELECT COUNT(*) FROM offers WHERE order_id = o.id AND status = 'active') as offer_count
    
FROM orders o
JOIN users s ON o.shopper_id = s.id
LEFT JOIN cities c ON o.destination_city_id = c.id
LEFT JOIN countries ct ON o.destination_country = ct.code
WHERE o.status IN ('active', 'matched')
AND o.deleted_at IS NULL
AND s.deleted_at IS NULL;

-- User statistics view
CREATE VIEW user_stats_view AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.display_name,
    u.role,
    u.shopper_rating,
    u.shopper_review_count,
    u.traveler_rating,
    u.traveler_review_count,
    u.total_orders_as_shopper,
    u.total_orders_as_traveler,
    u.created_at,
    
    -- Recent activity
    (SELECT COUNT(*) FROM orders WHERE shopper_id = u.id AND created_at > CURRENT_DATE - INTERVAL '30 days') as orders_last_30_days,
    (SELECT COUNT(*) FROM offers WHERE traveler_id = u.id AND created_at > CURRENT_DATE - INTERVAL '30 days') as offers_last_30_days
    
FROM users u
WHERE u.deleted_at IS NULL;

-- =============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =============================================================================

-- Function to calculate platform fee based on order value
CREATE OR REPLACE FUNCTION calculate_platform_fee(reward_amount DECIMAL, reward_currency VARCHAR(3))
RETURNS DECIMAL AS $$
DECLARE
    fee_percentage DECIMAL := 0.10; -- 10% platform fee
    min_fee DECIMAL := 2.00; -- Minimum $2 fee
    max_fee DECIMAL := 50.00; -- Maximum $50 fee
    calculated_fee DECIMAL;
BEGIN
    calculated_fee := reward_amount * fee_percentage;
    
    -- Apply min/max constraints (assuming USD, adjust for other currencies)
    IF reward_currency = 'USD' THEN
        calculated_fee := GREATEST(calculated_fee, min_fee);
        calculated_fee := LEAST(calculated_fee, max_fee);
    END IF;
    
    RETURN ROUND(calculated_fee, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create order (not suspended, verified, etc.)
CREATE OR REPLACE FUNCTION can_user_create_order(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record users%ROWTYPE;
BEGIN
    SELECT * INTO user_record FROM users WHERE id = user_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check user status and verifications
    IF user_record.status != 'active' THEN
        RETURN FALSE;
    END IF;
    
    IF NOT (user_record.email_verified AND user_record.payment_verified) THEN
        RETURN FALSE;
    END IF;
    
    IF user_record.role NOT IN ('shopper', 'both') THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get distance between two cities
CREATE OR REPLACE FUNCTION get_city_distance(city1_id UUID, city2_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    distance DECIMAL;
BEGIN
    SELECT 
        ST_Distance_Sphere(c1.location, c2.location) / 1000 -- Convert to kilometers
    INTO distance
    FROM cities c1, cities c2
    WHERE c1.id = city1_id AND c2.id = city2_id;
    
    RETURN ROUND(distance, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE SCHEMA IS 'Shippyar MVP - People-powered delivery marketplace database schema';