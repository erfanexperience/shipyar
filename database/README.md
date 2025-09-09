# Shippyar Database Architecture

## Overview
This directory contains the complete database architecture for Shippyar MVP - a people-powered delivery marketplace platform. The design supports dual-role users (shoppers and travelers), secure transactions, real-time messaging, and comprehensive compliance requirements.

## 📁 Directory Structure
```
database/
├── schema.sql                    # Complete PostgreSQL schema
├── migration_strategy.md         # Database migration and versioning strategy
├── backup_recovery_plan.md       # Comprehensive backup and disaster recovery
├── gdpr_compliance.md           # GDPR compliance and data privacy implementation
└── README.md                    # This overview document
```

## 🏗️ Architecture Overview

### Core Design Principles
1. **Dual-Role Support**: Users can be shoppers, travelers, or both
2. **Transaction Security**: Escrow system with multi-party payments
3. **Geographic Intelligence**: PostGIS integration for location-based features
4. **Audit Trail**: Comprehensive logging for compliance and debugging
5. **Soft Deletes**: Data retention with privacy compliance
6. **Scalability**: Optimized indexes and partitioning strategies

### Technology Stack
- **Database**: PostgreSQL 15+ with extensions
- **Extensions**: PostGIS, uuid-ossp, pg_trgm, unaccent
- **Migration Tool**: Alembic (Python-based)
- **Backup Strategy**: WAL archiving + automated backups
- **Monitoring**: Custom views and functions

## 📊 Database Schema Design

### 1. User Management & Authentication
```sql
-- Core entities
users                    -- User profiles with dual roles
user_sessions            -- Authentication sessions
user_verifications       -- Email, phone, identity verification
notification_preferences -- Communication settings
```

**Key Features:**
- Dual role support (shopper/traveler/both)
- Email and phone verification
- Rating system for both roles
- Comprehensive audit trails
- GDPR-compliant soft deletes

### 2. Geographic Data
```sql
-- Location entities
countries               -- Standardized country data
cities                 -- Major cities with coordinates
```

**Key Features:**
- PostGIS integration for spatial queries
- Timezone support
- Distance calculations
- Route optimization support

### 3. Marketplace & Orders
```sql
-- Core marketplace
orders                 -- Product requests from shoppers
offers                 -- Proposals from travelers
order_status_history   -- Complete audit trail
```

**Key Features:**
- Product URL caching
- Flexible pricing model
- Deadline management
- Status workflow tracking
- International currency support

### 4. Financial System
```sql
-- Payment processing
payment_methods        -- User payment information (tokenized)
transactions          -- All financial transactions
escrow_holdings       -- Order payment escrow
```

**Key Features:**
- PCI-compliant tokenization
- Multi-currency support
- Escrow protection
- Platform fee calculation
- Comprehensive transaction logging

### 5. Communication System
```sql
-- Messaging
conversations         -- Chat between users
messages             -- Individual messages
```

**Key Features:**
- Access control (unlocked after payment)
- Multiple message types (text, image, location)
- Read/delivery status
- Content moderation support

### 6. Reviews & Trust
```sql
-- Trust system
reviews              -- User reviews and ratings
```

**Key Features:**
- Verified purchase requirements
- Dual-role rating system
- Content moderation
- Public/private review options

### 7. Compliance & Monitoring
```sql
-- Compliance
audit_logs                  -- System-wide audit trail
data_retention_policies     -- Automated cleanup rules
consent_records            -- GDPR consent tracking
security_incidents         -- Security event logging
```

## 🔍 Key Design Decisions

### 1. Dual-Role User Model
**Decision**: Single `users` table with `role` enum supporting multiple roles
**Reasoning**: 
- Simplifies user management
- Allows role transitions
- Maintains relationship integrity
- Supports future role expansion

```sql
CREATE TYPE user_role AS ENUM ('shopper', 'traveler', 'both', 'admin');
```

### 2. Order-Centric Architecture
**Decision**: Orders as the central entity connecting all marketplace activities
**Reasoning**:
- Clear transaction boundaries
- Simplifies data relationships
- Enables comprehensive audit trails
- Supports dispute resolution

### 3. Geographic Data Strategy
**Decision**: PostGIS with standardized country/city tables
**Reasoning**:
- Efficient spatial queries
- Standardized location data
- Distance calculations
- Route optimization support
- Timezone handling

### 4. Financial Security Design
**Decision**: Separate transactions table with escrow holdings
**Reasoning**:
- PCI compliance
- Clear money flow tracking
- Dispute resolution support
- Platform fee transparency

### 5. Soft Delete Strategy
**Decision**: `deleted_at` columns with filtered indexes
**Reasoning**:
- GDPR compliance (right to erasure)
- Data recovery capabilities
- Audit trail preservation
- Performance optimization

### 6. Audit Trail Implementation
**Decision**: Comprehensive audit logging with triggers
**Reasoning**:
- Regulatory compliance
- Debugging capabilities
- Security monitoring
- User activity tracking

## 🚀 Performance Optimizations

### 1. Indexing Strategy
```sql
-- Core performance indexes
CREATE INDEX CONCURRENTLY idx_orders_shopper ON orders(shopper_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_cities_location ON cities USING GIST(location);
```

### 2. Query Optimization
- Filtered indexes on soft-deleted records
- Partial indexes for active data
- Full-text search with GIN indexes
- Spatial indexes for geographic queries

### 3. Partitioning Strategy (Future)
- Audit logs by month
- Notifications by date
- Transactions by year

## 🔒 Security & Compliance

### 1. Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Tokenization**: Payment methods tokenized
- **Access Control**: Row-level security policies
- **Audit Trails**: Comprehensive logging

### 2. GDPR Compliance
- **Right to Access**: Data export functions
- **Right to Rectification**: Correction workflows
- **Right to Erasure**: Anonymization procedures
- **Data Portability**: Machine-readable exports
- **Consent Management**: Granular consent tracking

### 3. Financial Compliance
- **PCI DSS**: Payment data tokenization
- **AML**: Transaction monitoring
- **Data Retention**: 7-year financial record retention
- **Audit Requirements**: Comprehensive transaction logging

## 📈 Scalability Considerations

### 1. Read Replicas
- Separate read replicas for analytics
- Geographic distribution for global users
- Load balancing strategies

### 2. Caching Strategy
- Product information caching
- User session caching
- Geographic data caching

### 3. Archival Strategy
- Historical data archival
- Log rotation policies
- Cold storage for old records

## 🛠️ Migration Strategy

### 1. Version Control
- Alembic-based migrations
- Environment-specific configurations
- Rollback capabilities

### 2. Zero-Downtime Deployments
- Expand-contract pattern
- Concurrent index creation
- Progressive rollouts

### 3. Data Migration
- ETL processes for data transformation
- Validation procedures
- Rollback strategies

## 📋 Monitoring & Maintenance

### 1. Health Checks
- Connection monitoring
- Query performance tracking
- Disk space monitoring
- Backup verification

### 2. Performance Monitoring
- Slow query detection
- Index usage analysis
- Connection pool monitoring
- Resource utilization tracking

### 3. Automated Maintenance
- Statistics updates
- Index maintenance
- Partition management
- Cleanup procedures

## 🔧 Development Setup

### Prerequisites
```bash
# Install PostgreSQL 15+
brew install postgresql@15

# Install PostGIS
brew install postgis

# Install Python dependencies
pip install psycopg2-binary alembic
```

### Initial Setup
```bash
# Create development database
createdb shippyar_dev

# Install extensions
psql shippyar_dev -c "CREATE EXTENSION postgis;"
psql shippyar_dev -c "CREATE EXTENSION uuid-ossp;"

# Run initial schema
psql shippyar_dev -f schema.sql
```

### Migration Workflow
```bash
# Initialize Alembic
alembic init migrations

# Create new migration
alembic revision --autogenerate -m "Add new feature"

# Apply migrations
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

## 📚 Additional Resources

### Documentation
- [Migration Strategy](migration_strategy.md) - Detailed migration procedures
- [Backup & Recovery](backup_recovery_plan.md) - Disaster recovery planning
- [GDPR Compliance](gdpr_compliance.md) - Privacy and compliance implementation

### Tools & Scripts
- Daily backup scripts
- Performance monitoring queries
- Compliance checking functions
- Data export utilities

### Best Practices
- Always use transactions for related changes
- Test migrations on staging first
- Monitor query performance regularly
- Keep audit trails comprehensive
- Maintain GDPR compliance procedures

## 🤝 Contributing

### Schema Changes
1. Create migration with descriptive name
2. Include both upgrade and downgrade procedures
3. Test on staging environment
4. Update documentation

### Code Review Checklist
- [ ] Migration tested both directions
- [ ] Indexes added for new queries
- [ ] Constraints validate data integrity
- [ ] GDPR compliance maintained
- [ ] Performance impact assessed
- [ ] Documentation updated

## 📞 Support

For database-related questions or issues:
- Architecture questions: Review design decisions in this document
- Migration issues: Check migration_strategy.md
- Performance problems: Use monitoring queries in schema.sql
- Compliance questions: Reference gdpr_compliance.md

This database architecture provides a solid foundation for Shippyar's marketplace platform, balancing performance, security, compliance, and scalability requirements.