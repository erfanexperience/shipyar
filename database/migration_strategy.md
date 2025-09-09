# Shippyar Database Migration Strategy

## Overview
This document outlines the database migration strategy for Shippyar MVP, including initial setup, version control, and future schema changes.

## Migration Framework
We'll use **Alembic** (Python) for database migrations, which provides:
- Version control for database schemas
- Automatic migration generation
- Rollback capabilities
- Environment-specific configurations

## Directory Structure
```
database/
├── schema.sql                 # Complete schema definition
├── migrations/               # Alembic migration files
│   ├── versions/            # Individual migration files
│   ├── alembic.ini         # Alembic configuration
│   ├── env.py              # Migration environment setup
│   └── script.py.mako      # Migration template
├── seeds/                   # Seed data files
│   ├── countries.sql       # Country reference data
│   ├── cities.sql          # Major cities data
│   └── dev_data.sql        # Development test data
├── backups/                # Database backup scripts
├── monitoring/             # Performance monitoring queries
└── docs/                   # Database documentation
```

## Initial Setup Steps

### 1. Environment Setup
```bash
# Install dependencies
pip install alembic psycopg2-binary

# Initialize Alembic in project
cd database
alembic init migrations
```

### 2. Database Creation
```sql
-- Create databases for different environments
CREATE DATABASE shippyar_dev;
CREATE DATABASE shippyar_test;
CREATE DATABASE shippyar_staging;
CREATE DATABASE shippyar_prod;

-- Create application user
CREATE USER shippyar_app WITH PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE shippyar_dev TO shippyar_app;
GRANT CONNECT ON DATABASE shippyar_test TO shippyar_app;
```

### 3. Initial Migration
The initial migration will create all tables, indexes, and constraints:

```python
# migrations/versions/001_initial_schema.py
"""Initial schema creation

Revision ID: 001
Create Date: 2024-01-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Load and execute the complete schema
def upgrade():
    # Execute schema.sql content here
    pass

def downgrade():
    # Drop all tables in reverse order
    pass
```

## Migration Best Practices

### 1. Naming Convention
- Format: `{version}_{description}.py`
- Example: `002_add_user_preferences.py`
- Use descriptive names that explain the change

### 2. Backward Compatibility
- Always provide rollback functionality
- Test migrations on staging before production
- Keep migrations atomic (all-or-nothing)

### 3. Data Migration Strategy
```python
# Example data migration
def upgrade():
    # Schema changes first
    op.add_column('users', sa.Column('subscription_tier', sa.String(20)))
    
    # Then data migration
    connection = op.get_bind()
    connection.execute("""
        UPDATE users SET subscription_tier = 'basic' 
        WHERE subscription_tier IS NULL
    """)
    
    # Finally constraints
    op.alter_column('users', 'subscription_tier', nullable=False)
```

### 4. Index Management
- Create indexes CONCURRENTLY in production
- Drop unused indexes before adding new ones
- Monitor index usage with pg_stat_user_indexes

## Environment-Specific Configurations

### Development
- Full logging enabled
- Relaxed constraints for testing
- Seed data automatically loaded

### Testing
- Isolated database per test suite
- Fast rollback/recreation
- Minimal seed data

### Staging
- Production-like data volume
- Migration testing environment
- Performance monitoring enabled

### Production
- Zero-downtime migrations
- Full backup before major changes
- Monitoring and alerting active

## Zero-Downtime Migration Strategies

### 1. Additive Changes
```sql
-- Safe: Adding nullable columns
ALTER TABLE users ADD COLUMN new_field VARCHAR(100);

-- Safe: Adding indexes concurrently
CREATE INDEX CONCURRENTLY idx_new_field ON users(new_field);
```

### 2. Column Modifications
```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN email_v2 VARCHAR(320);

-- Step 2: Populate new column
UPDATE users SET email_v2 = email WHERE email_v2 IS NULL;

-- Step 3: Application deployment (use email_v2)

-- Step 4: Drop old column
ALTER TABLE users DROP COLUMN email;

-- Step 5: Rename new column
ALTER TABLE users RENAME COLUMN email_v2 TO email;
```

### 3. Table Restructuring
Use the "expand-contract" pattern:
1. **Expand**: Add new structure alongside old
2. **Migrate**: Dual-write to both structures
3. **Contract**: Remove old structure

## Backup Strategy

### Automated Backups
```bash
#!/bin/bash
# daily_backup.sh

DB_NAME="shippyar_prod"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

# Full backup
pg_dump -h localhost -U postgres -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_DIR/shippyar_full_$DATE.backup"

# Schema-only backup
pg_dump -h localhost -U postgres -d $DB_NAME \
    --schema-only \
    --file="$BACKUP_DIR/shippyar_schema_$DATE.sql"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.backup" -mtime +30 -delete
```

### Point-in-Time Recovery
- Enable WAL archiving
- Regular base backups
- Transaction log shipping

### Pre-Migration Backup
```bash
# Before major migrations
pg_dump -h localhost -U postgres -d shippyar_prod \
    --format=custom \
    --compress=9 \
    --file="/var/backups/pre_migration_$(date +%Y%m%d).backup"
```

## Monitoring and Health Checks

### Performance Monitoring
```sql
-- Monitor slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;

-- Database size monitoring
SELECT 
    pg_size_pretty(pg_database_size('shippyar_prod')) as db_size;
```

### Health Check Queries
```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Long running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Blocking queries
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
    JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
    JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## Security Considerations

### User Permissions
```sql
-- Application user permissions
GRANT CONNECT ON DATABASE shippyar_prod TO shippyar_app;
GRANT USAGE ON SCHEMA public TO shippyar_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shippyar_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO shippyar_app;

-- Read-only user for analytics
CREATE USER analytics_ro WITH PASSWORD 'analytics_password';
GRANT CONNECT ON DATABASE shippyar_prod TO analytics_ro;
GRANT USAGE ON SCHEMA public TO analytics_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_ro;

-- Backup user
CREATE USER backup_user WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE shippyar_prod TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
```

### Row Level Security (RLS)
```sql
-- Enable RLS for sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY user_own_data ON users
    FOR ALL TO shippyar_app
    USING (id = current_setting('app.user_id')::uuid);

-- Policy: Admins can see all data
CREATE POLICY admin_all_data ON users
    FOR ALL TO shippyar_app
    USING (current_setting('app.user_role') = 'admin');
```

## Testing Strategy

### Migration Testing
1. Test on staging environment first
2. Verify data integrity before and after
3. Performance testing with production-like data
4. Rollback testing

### Automated Tests
```python
# test_migrations.py
import pytest
from alembic import command
from alembic.config import Config

def test_migrations_up_and_down():
    """Test that migrations can be applied and rolled back"""
    alembic_cfg = Config("alembic.ini")
    
    # Run all migrations
    command.upgrade(alembic_cfg, "head")
    
    # Rollback one migration
    command.downgrade(alembic_cfg, "-1")
    
    # Re-apply
    command.upgrade(alembic_cfg, "head")
```

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)
- **Critical**: < 4 hours
- **Important**: < 24 hours  
- **Normal**: < 72 hours

### Recovery Point Objectives (RPO)
- **Critical data**: < 15 minutes
- **Important data**: < 1 hour
- **Normal data**: < 24 hours

### Recovery Procedures
1. **Assessment**: Determine scope of data loss
2. **Communication**: Notify stakeholders
3. **Restoration**: Restore from most recent valid backup
4. **Verification**: Validate data integrity
5. **Application restart**: Bring services back online
6. **Monitoring**: Watch for issues post-recovery

## Maintenance Windows

### Regular Maintenance
- **Weekly**: Index maintenance, statistics update
- **Monthly**: Full backup verification, query performance review
- **Quarterly**: Major version updates, capacity planning

### Emergency Maintenance
- Process for urgent schema changes
- Approval workflow
- Rollback procedures

## Conclusion

This migration strategy ensures:
- **Safety**: Comprehensive backup and rollback procedures
- **Performance**: Monitoring and optimization strategies
- **Reliability**: Testing and validation processes
- **Scalability**: Planning for growth and changes
- **Security**: Access controls and data protection

Regular review and updates of this strategy will ensure it remains effective as Shippyar grows.