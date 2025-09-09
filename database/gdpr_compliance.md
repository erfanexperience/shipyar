# GDPR Compliance and Data Privacy for Shippyar Database

## Overview
This document outlines the database design considerations and implementation strategies for GDPR (General Data Protection Regulation) compliance in the Shippyar marketplace platform.

## Legal Basis for Data Processing

### 1. Contract Performance (Article 6(1)(b))
- **Purpose**: Order fulfillment, payment processing, delivery coordination
- **Data**: User profiles, order details, payment information, delivery addresses
- **Retention**: Duration of contract + legal requirements

### 2. Legitimate Interest (Article 6(1)(f))
- **Purpose**: Fraud prevention, platform security, service improvement
- **Data**: Login logs, audit trails, usage analytics
- **Retention**: Balanced against user rights

### 3. Consent (Article 6(1)(a))
- **Purpose**: Marketing communications, optional features
- **Data**: Communication preferences, optional profile data
- **Retention**: Until consent withdrawn

### 4. Legal Obligation (Article 6(1)(c))
- **Purpose**: Tax records, anti-money laundering, dispute resolution
- **Data**: Transaction records, identity verification
- **Retention**: As required by law (typically 7 years)

## Personal Data Classification

### Category 1: Identity Data
```sql
-- Tables: users, user_verifications
-- Fields: first_name, last_name, email, phone, date_of_birth
-- Special handling: Encryption at rest, access logging
```

### Category 2: Financial Data
```sql
-- Tables: transactions, payment_methods, escrow_holdings
-- Fields: payment details, transaction amounts, bank information
-- Special handling: PCI DSS compliance, tokenization
```

### Category 3: Location Data
```sql
-- Tables: orders (destination), cities, audit_logs (ip_address)
-- Fields: addresses, coordinates, IP addresses
-- Special handling: Geolocation restrictions, anonymization
```

### Category 4: Communication Data
```sql
-- Tables: messages, notifications, reviews
-- Fields: Message content, communication preferences
-- Special handling: Content scanning, retention limits
```

### Category 5: Behavioral Data
```sql
-- Tables: audit_logs, user_sessions, notifications
-- Fields: Usage patterns, device information, timestamps
-- Special handling: Aggregation, pseudonymization
```

## GDPR Rights Implementation

### 1. Right to Access (Article 15)

```sql
-- Data export function for user access requests
CREATE OR REPLACE FUNCTION export_user_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    user_data JSON;
BEGIN
    SELECT json_build_object(
        'personal_info', (
            SELECT json_build_object(
                'id', id,
                'email', email,
                'first_name', first_name,
                'last_name', last_name,
                'phone', phone,
                'created_at', created_at,
                'last_login_at', last_login_at,
                'status', status,
                'role', role
            ) FROM users WHERE id = user_uuid AND deleted_at IS NULL
        ),
        'orders_as_shopper', (
            SELECT json_agg(json_build_object(
                'id', id,
                'product_name', product_name,
                'reward_amount', reward_amount,
                'status', status,
                'created_at', created_at,
                'destination_country', destination_country
            )) FROM orders WHERE shopper_id = user_uuid AND deleted_at IS NULL
        ),
        'orders_as_traveler', (
            SELECT json_agg(json_build_object(
                'id', id,
                'product_name', product_name,
                'reward_amount', reward_amount,
                'status', status,
                'created_at', created_at
            )) FROM orders WHERE matched_traveler_id = user_uuid AND deleted_at IS NULL
        ),
        'transactions', (
            SELECT json_agg(json_build_object(
                'id', id,
                'amount', amount,
                'currency', currency,
                'transaction_type', transaction_type,
                'status', status,
                'created_at', created_at
            )) FROM transactions 
            WHERE payer_id = user_uuid OR recipient_id = user_uuid
        ),
        'reviews_given', (
            SELECT json_agg(json_build_object(
                'id', id,
                'rating', rating,
                'comment', comment,
                'created_at', created_at
            )) FROM reviews WHERE reviewer_id = user_uuid AND deleted_at IS NULL
        ),
        'reviews_received', (
            SELECT json_agg(json_build_object(
                'id', id,
                'rating', rating,
                'comment', comment,
                'created_at', created_at
            )) FROM reviews WHERE reviewee_id = user_uuid AND deleted_at IS NULL
        )
    ) INTO user_data;
    
    RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Right to Rectification (Article 16)

```sql
-- Audit trail for data corrections
CREATE TABLE data_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    correction_reason TEXT,
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to handle data correction requests
CREATE OR REPLACE FUNCTION request_data_correction(
    p_user_id UUID,
    p_table_name VARCHAR(100),
    p_field_name VARCHAR(100),
    p_new_value TEXT,
    p_reason TEXT
) RETURNS UUID AS $$
DECLARE
    correction_id UUID;
    current_value TEXT;
BEGIN
    -- Get current value (simplified - actual implementation would be more complex)
    EXECUTE format('SELECT %I FROM %I WHERE id = $1', p_field_name, p_table_name) 
    INTO current_value USING p_user_id;
    
    -- Create correction request
    INSERT INTO data_corrections (
        user_id, table_name, field_name, old_value, new_value, 
        correction_reason, requested_by
    ) VALUES (
        p_user_id, p_table_name, p_field_name, current_value, 
        p_new_value, p_reason, p_user_id
    ) RETURNING id INTO correction_id;
    
    RETURN correction_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. Right to Erasure (Article 17)

```sql
-- Comprehensive data deletion function
CREATE OR REPLACE FUNCTION anonymize_user_data(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    anonymized_email VARCHAR(255);
    anonymized_name VARCHAR(100);
BEGIN
    -- Generate anonymized identifiers
    anonymized_email := 'deleted_user_' || user_uuid || '@anonymized.local';
    anonymized_name := 'Deleted User';
    
    -- Start transaction
    BEGIN
        -- Anonymize user personal data
        UPDATE users SET
            email = anonymized_email,
            phone = NULL,
            first_name = anonymized_name,
            last_name = '',
            display_name = anonymized_name,
            avatar_url = NULL,
            bio = NULL,
            date_of_birth = NULL,
            primary_city = NULL,
            deleted_at = CURRENT_TIMESTAMP
        WHERE id = user_uuid;
        
        -- Remove payment methods
        UPDATE payment_methods SET deleted_at = CURRENT_TIMESTAMP
        WHERE user_id = user_uuid;
        
        -- Anonymize messages (keep for order history but remove personal content)
        UPDATE messages SET
            content = '[Message deleted by user request]',
            media_url = NULL,
            deleted_at = CURRENT_TIMESTAMP
        WHERE sender_id = user_uuid;
        
        -- Remove personal data from reviews but keep ratings for platform integrity
        UPDATE reviews SET
            title = NULL,
            comment = '[Review deleted by user request]',
            deleted_at = CURRENT_TIMESTAMP
        WHERE reviewer_id = user_uuid;
        
        -- Delete verification data
        DELETE FROM user_verifications WHERE user_id = user_uuid;
        
        -- Delete sessions
        DELETE FROM user_sessions WHERE user_id = user_uuid;
        
        -- Delete notification preferences
        DELETE FROM notification_preferences WHERE user_id = user_uuid;
        
        -- Log the anonymization
        INSERT INTO audit_logs (
            user_id, action, table_name, context
        ) VALUES (
            user_uuid, 'GDPR_ANONYMIZATION', 'users',
            json_build_object('timestamp', CURRENT_TIMESTAMP, 'type', 'right_to_erasure')
        );
        
        RETURN TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
            RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Data retention policy enforcement
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER := 0;
BEGIN
    -- Delete old audit logs (7 years retention)
    DELETE FROM audit_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '7 years';
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Delete old notifications (1 year retention)
    DELETE FROM notifications 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
    
    -- Delete expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete expired password reset tokens
    DELETE FROM password_reset_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Archive old product cache entries
    DELETE FROM product_cache 
    WHERE last_updated < CURRENT_DATE - INTERVAL '30 days';
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;
```

### 4. Right to Data Portability (Article 20)

```sql
-- Export user data in machine-readable format
CREATE OR REPLACE FUNCTION export_portable_data(user_uuid UUID)
RETURNS TABLE(
    data_type VARCHAR(50),
    data_json JSON,
    export_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'user_profile'::VARCHAR(50),
        json_build_object(
            'email', u.email,
            'name', u.first_name || ' ' || u.last_name,
            'phone', u.phone,
            'member_since', u.created_at,
            'location', json_build_object(
                'country', u.primary_country,
                'city', u.primary_city
            ),
            'preferences', json_build_object(
                'language', u.preferred_language,
                'currency', u.preferred_currency
            )
        ),
        CURRENT_TIMESTAMP
    FROM users u WHERE u.id = user_uuid AND u.deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
        'order_history'::VARCHAR(50),
        json_agg(json_build_object(
            'order_id', o.id,
            'product_name', o.product_name,
            'product_url', o.product_url,
            'reward_amount', o.reward_amount,
            'currency', o.reward_currency,
            'destination', json_build_object(
                'country', o.destination_country,
                'city', c.name
            ),
            'status', o.status,
            'created_date', o.created_at,
            'completed_date', o.completed_at
        )),
        CURRENT_TIMESTAMP
    FROM orders o
    LEFT JOIN cities c ON o.destination_city_id = c.id
    WHERE o.shopper_id = user_uuid AND o.deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
        'transaction_history'::VARCHAR(50),
        json_agg(json_build_object(
            'transaction_id', t.id,
            'amount', t.amount,
            'currency', t.currency,
            'type', t.transaction_type,
            'status', t.status,
            'date', t.created_at
        )),
        CURRENT_TIMESTAMP
    FROM transactions t
    WHERE (t.payer_id = user_uuid OR t.recipient_id = user_uuid);
END;
$$ LANGUAGE plpgsql;
```

### 5. Right to Restrict Processing (Article 18)

```sql
-- Processing restriction flags
ALTER TABLE users ADD COLUMN processing_restricted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN restriction_reason TEXT;
ALTER TABLE users ADD COLUMN restriction_date TIMESTAMP WITH TIME ZONE;

-- Function to restrict user data processing
CREATE OR REPLACE FUNCTION restrict_user_processing(
    user_uuid UUID,
    reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users SET
        processing_restricted = TRUE,
        restriction_reason = reason,
        restriction_date = CURRENT_TIMESTAMP
    WHERE id = user_uuid;
    
    -- Log the restriction
    INSERT INTO audit_logs (
        user_id, action, table_name, context
    ) VALUES (
        user_uuid, 'PROCESSING_RESTRICTED', 'users',
        json_build_object('reason', reason, 'timestamp', CURRENT_TIMESTAMP)
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

### 6. Right to Object (Article 21)

```sql
-- Marketing consent management
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL, -- 'marketing', 'analytics', 'profiling'
    consent_given BOOLEAN NOT NULL,
    legal_basis VARCHAR(100),
    consent_method VARCHAR(50), -- 'website', 'email', 'api'
    consent_text TEXT, -- What the user agreed to
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at TIMESTAMP WITH TIME ZONE
);

-- Function to record consent
CREATE OR REPLACE FUNCTION record_consent(
    user_uuid UUID,
    consent_type VARCHAR(50),
    consent_given BOOLEAN,
    legal_basis VARCHAR(100),
    consent_method VARCHAR(50),
    consent_text TEXT,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    consent_id UUID;
BEGIN
    INSERT INTO consent_records (
        user_id, consent_type, consent_given, legal_basis,
        consent_method, consent_text, ip_address, user_agent
    ) VALUES (
        user_uuid, consent_type, consent_given, legal_basis,
        consent_method, consent_text, ip_address, user_agent
    ) RETURNING id INTO consent_id;
    
    RETURN consent_id;
END;
$$ LANGUAGE plpgsql;
```

## Data Protection by Design

### 1. Pseudonymization
```sql
-- Pseudonymization function using HMAC
CREATE OR REPLACE FUNCTION pseudonymize_identifier(
    original_id VARCHAR(255),
    salt VARCHAR(255)
) RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(hmac(original_id, salt, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Analytics table with pseudonymized data
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pseudonym_id VARCHAR(64) NOT NULL, -- Pseudonymized user ID
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    session_pseudonym VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Data Minimization
```sql
-- View for limited user data access
CREATE VIEW user_public_profile AS
SELECT 
    id,
    first_name,
    display_name,
    avatar_url,
    shopper_rating,
    traveler_rating,
    shopper_review_count,
    traveler_review_count,
    DATE_PART('year', created_at) as member_since_year
FROM users 
WHERE deleted_at IS NULL 
AND processing_restricted = FALSE;

-- Limited order view for public display
CREATE VIEW public_orders AS
SELECT 
    id,
    product_name,
    reward_amount,
    reward_currency,
    destination_country,
    deadline_date,
    status,
    created_at
FROM orders 
WHERE status = 'active' 
AND deleted_at IS NULL;
```

### 3. Encryption at Rest
```sql
-- Encrypted sensitive fields using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, key);
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data BYTEA, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, key);
END;
$$ LANGUAGE plpgsql;
```

## Cross-Border Data Transfers

### 1. Adequacy Decisions
```sql
-- Country adequacy status for data transfers
CREATE TABLE country_adequacy (
    country_code VARCHAR(2) PRIMARY KEY REFERENCES countries(code),
    adequacy_decision BOOLEAN DEFAULT FALSE,
    adequacy_date DATE,
    restrictions JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Standard Contractual Clauses tracking
CREATE TABLE data_transfer_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(2) REFERENCES countries(code),
    agreement_type VARCHAR(50), -- 'SCC', 'BCR', 'adequacy'
    agreement_date DATE,
    expiry_date DATE,
    document_url TEXT,
    is_active BOOLEAN DEFAULT TRUE
);
```

### 2. Data Localization Rules
```sql
-- Function to check data transfer legality
CREATE OR REPLACE FUNCTION is_data_transfer_legal(
    user_country VARCHAR(2),
    destination_country VARCHAR(2)
) RETURNS BOOLEAN AS $$
DECLARE
    is_legal BOOLEAN := FALSE;
BEGIN
    -- Check adequacy decision
    SELECT adequacy_decision INTO is_legal
    FROM country_adequacy 
    WHERE country_code = destination_country;
    
    -- If no adequacy decision, check for SCCs
    IF NOT is_legal THEN
        SELECT EXISTS(
            SELECT 1 FROM data_transfer_agreements
            WHERE country_code = destination_country
            AND is_active = TRUE
            AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
        ) INTO is_legal;
    END IF;
    
    RETURN is_legal;
END;
$$ LANGUAGE plpgsql;
```

## Compliance Monitoring

### 1. GDPR Compliance Dashboard
```sql
-- Create compliance monitoring views
CREATE VIEW gdpr_compliance_metrics AS
SELECT 
    'data_subject_requests' as metric_name,
    COUNT(*) as metric_value,
    DATE_TRUNC('month', created_at) as period
FROM audit_logs 
WHERE action LIKE 'GDPR_%'
GROUP BY DATE_TRUNC('month', created_at)

UNION ALL

SELECT 
    'consent_withdrawals' as metric_name,
    COUNT(*) as metric_value,
    DATE_TRUNC('month', withdrawn_at) as period
FROM consent_records
WHERE withdrawn_at IS NOT NULL
GROUP BY DATE_TRUNC('month', withdrawn_at);

-- Data retention compliance check
CREATE VIEW retention_compliance AS
SELECT 
    table_name,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    CASE 
        WHEN MIN(created_at) < CURRENT_DATE - INTERVAL '7 years' 
        THEN 'NON_COMPLIANT'
        ELSE 'COMPLIANT'
    END as compliance_status
FROM (
    SELECT 'audit_logs' as table_name, created_at FROM audit_logs
    UNION ALL
    SELECT 'transactions' as table_name, created_at FROM transactions
    UNION ALL
    SELECT 'orders' as table_name, created_at FROM orders
) combined_data
GROUP BY table_name;
```

### 2. Automated Compliance Checks
```sql
-- Daily compliance check function
CREATE OR REPLACE FUNCTION daily_compliance_check()
RETURNS TABLE(
    check_name VARCHAR(100),
    status VARCHAR(20),
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Check for users with expired data
    SELECT 
        'user_data_retention'::VARCHAR(100),
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::VARCHAR(20),
        'Found ' || COUNT(*) || ' users with data older than retention period'::TEXT
    FROM users 
    WHERE created_at < CURRENT_DATE - INTERVAL '10 years'
    AND deleted_at IS NULL
    
    UNION ALL
    
    -- Check for unprocessed deletion requests
    SELECT 
        'pending_deletions'::VARCHAR(100),
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END::VARCHAR(20),
        'Found ' || COUNT(*) || ' users marked for deletion but not anonymized'::TEXT
    FROM users 
    WHERE status = 'deactivated'
    AND deleted_at IS NOT NULL
    AND email NOT LIKE 'deleted_user_%@anonymized.local'
    
    UNION ALL
    
    -- Check consent records
    SELECT 
        'consent_records'::VARCHAR(100),
        'PASS'::VARCHAR(20),
        'Total consent records: ' || COUNT(*)::TEXT
    FROM consent_records;
END;
$$ LANGUAGE plpgsql;
```

## Incident Response

### 1. Data Breach Detection
```sql
-- Suspicious activity monitoring
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description TEXT NOT NULL,
    affected_users JSONB, -- Array of user IDs
    data_categories JSONB, -- Array of data types affected
    detection_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolution_time TIMESTAMP WITH TIME ZONE,
    notification_required BOOLEAN DEFAULT FALSE,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id)
);

-- Function to log potential data breach
CREATE OR REPLACE FUNCTION log_security_incident(
    incident_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT,
    affected_users JSONB DEFAULT NULL,
    data_categories JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    incident_id UUID;
    notification_required BOOLEAN := FALSE;
BEGIN
    -- Determine if breach notification is required
    IF severity IN ('high', 'critical') THEN
        notification_required := TRUE;
    END IF;
    
    INSERT INTO security_incidents (
        incident_type, severity, description, affected_users,
        data_categories, notification_required
    ) VALUES (
        incident_type, severity, description, affected_users,
        data_categories, notification_required
    ) RETURNING id INTO incident_id;
    
    -- If critical, immediately alert
    IF severity = 'critical' THEN
        -- Trigger immediate notification (implementation specific)
        PERFORM pg_notify('critical_security_incident', incident_id::TEXT);
    END IF;
    
    RETURN incident_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. Breach Notification Workflow
```sql
-- Track regulatory notifications
CREATE TABLE breach_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES security_incidents(id),
    authority VARCHAR(100) NOT NULL, -- 'supervisory_authority', 'data_subject'
    notification_method VARCHAR(50), -- 'email', 'portal', 'letter'
    notification_date TIMESTAMP WITH TIME ZONE,
    response_deadline TIMESTAMP WITH TIME ZONE,
    response_received TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

This comprehensive GDPR compliance framework ensures that Shippyar meets all data protection requirements while maintaining operational efficiency and user trust.