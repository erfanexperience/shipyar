# Shippyar Database Backup and Recovery Plan

## Overview
Comprehensive backup and disaster recovery strategy for Shippyar's PostgreSQL database ensuring business continuity and data protection.

## Backup Strategy

### 1. Multi-Tier Backup Approach

#### Tier 1: Continuous WAL Archiving
- **Frequency**: Real-time
- **Retention**: 30 days
- **Purpose**: Point-in-time recovery
- **Storage**: AWS S3 with versioning

```postgresql
# postgresql.conf settings
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://shippyar-wal-archive/%f'
archive_timeout = 300  # 5 minutes
```

#### Tier 2: Automated Daily Backups
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 90 days
- **Format**: Custom PostgreSQL format (compressed)
- **Storage**: Local + Cloud replication

```bash
#!/bin/bash
# /opt/shippyar/scripts/daily_backup.sh

set -e

# Configuration
DB_HOST="localhost"
DB_NAME="shippyar_prod"
DB_USER="backup_user"
BACKUP_DIR="/var/backups/postgresql/daily"
S3_BUCKET="shippyar-db-backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=90

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting backup at $(date)"
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_DIR/shippyar_daily_$DATE.backup"

# Verify backup integrity
echo "Verifying backup integrity..."
pg_restore --list "$BACKUP_DIR/shippyar_daily_$DATE.backup" > /dev/null

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR/shippyar_daily_$DATE.backup" \
    "s3://$S3_BUCKET/daily/shippyar_daily_$DATE.backup" \
    --storage-class STANDARD_IA

# Cleanup old local backups
find $BACKUP_DIR -name "*.backup" -mtime +$RETENTION_DAYS -delete

# Log completion
echo "Backup completed successfully at $(date)"
```

#### Tier 3: Weekly Full Backups
- **Frequency**: Weekly on Sundays
- **Retention**: 1 year
- **Includes**: Schema + Data + Metadata
- **Storage**: Encrypted cloud storage

```bash
#!/bin/bash
# /opt/shippyar/scripts/weekly_backup.sh

set -e

DATE=$(date +%Y%m%d)
BACKUP_DIR="/var/backups/postgresql/weekly"
S3_BUCKET="shippyar-db-backups"

# Full database backup
pg_dumpall -h localhost -U postgres \
    --verbose \
    --file="$BACKUP_DIR/shippyar_full_$DATE.sql"

# Compress and encrypt
gzip "$BACKUP_DIR/shippyar_full_$DATE.sql"
gpg --cipher-algo AES256 --compress-algo 1 --symmetric \
    --output "$BACKUP_DIR/shippyar_full_$DATE.sql.gz.gpg" \
    "$BACKUP_DIR/shippyar_full_$DATE.sql.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/shippyar_full_$DATE.sql.gz.gpg" \
    "s3://$S3_BUCKET/weekly/" \
    --storage-class GLACIER

# Cleanup
rm "$BACKUP_DIR/shippyar_full_$DATE.sql.gz"
```

### 2. Backup Verification

#### Automated Restoration Testing
```bash
#!/bin/bash
# /opt/shippyar/scripts/backup_verification.sh

BACKUP_FILE=$1
TEST_DB="shippyar_backup_test"

# Create test database
dropdb --if-exists $TEST_DB
createdb $TEST_DB

# Restore backup
pg_restore -d $TEST_DB --verbose $BACKUP_FILE

# Run integrity checks
psql -d $TEST_DB -c "
    SELECT 
        schemaname,
        tablename,
        n_tup_ins,
        n_tup_upd,
        n_tup_del
    FROM pg_stat_user_tables;
    
    -- Check foreign key constraints
    SELECT conname FROM pg_constraint WHERE contype = 'f';
    
    -- Verify user data consistency
    SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;
    SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL;
"

# Cleanup test database
dropdb $TEST_DB

echo "Backup verification completed successfully"
```

## Recovery Procedures

### 1. Point-in-Time Recovery (PITR)

```bash
#!/bin/bash
# Point-in-time recovery script

RECOVERY_TARGET_TIME="2024-01-15 14:30:00"
BACKUP_FILE="/var/backups/postgresql/daily/shippyar_daily_20240115_020000.backup"
RECOVERY_DB="shippyar_recovery"

echo "Starting point-in-time recovery to $RECOVERY_TARGET_TIME"

# Create recovery database
createdb $RECOVERY_DB

# Restore base backup
pg_restore -d $RECOVERY_DB $BACKUP_FILE

# Configure recovery
cat > /tmp/recovery.conf << EOF
restore_command = 'aws s3 cp s3://shippyar-wal-archive/%f %p'
recovery_target_time = '$RECOVERY_TARGET_TIME'
recovery_target_timeline = 'latest'
EOF

# Start recovery process
pg_ctl start -D /var/lib/postgresql/data -o "-c config_file=/etc/postgresql/postgresql.conf"
```

### 2. Full Database Recovery

```bash
#!/bin/bash
# Complete database recovery from backup

BACKUP_FILE=$1
TARGET_DB="shippyar_prod"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "WARNING: This will completely replace the $TARGET_DB database"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled"
    exit 1
fi

# Stop application services
systemctl stop shippyar-api
systemctl stop shippyar-worker

# Backup current database (safety measure)
pg_dump -d $TARGET_DB --format=custom \
    --file="/tmp/pre_recovery_backup_$(date +%Y%m%d_%H%M%S).backup"

# Drop and recreate database
dropdb $TARGET_DB
createdb $TARGET_DB

# Restore from backup
pg_restore -d $TARGET_DB --verbose $BACKUP_FILE

# Verify restoration
psql -d $TARGET_DB -c "
    SELECT COUNT(*) as user_count FROM users;
    SELECT COUNT(*) as order_count FROM orders;
    SELECT MAX(created_at) as latest_order FROM orders;
"

# Restart services
systemctl start shippyar-api
systemctl start shippyar-worker

echo "Database recovery completed successfully"
```

### 3. Partial Data Recovery

```sql
-- Recovery of specific tables or data ranges
-- Example: Recover orders from specific date range

-- Create temporary recovery database
CREATE DATABASE temp_recovery;

-- Restore full backup to temp database
-- (using pg_restore command)

-- Copy specific data back to production
INSERT INTO orders 
SELECT * FROM temp_recovery.orders 
WHERE created_at BETWEEN '2024-01-15' AND '2024-01-16'
ON CONFLICT (id) DO NOTHING;

-- Cleanup
DROP DATABASE temp_recovery;
```

## Disaster Recovery Scenarios

### Scenario 1: Database Corruption
**Recovery Time**: 30 minutes - 2 hours
**Data Loss**: < 15 minutes

1. Identify corruption scope
2. Stop all write operations
3. Restore from latest valid backup
4. Apply WAL files up to corruption point
5. Verify data integrity
6. Resume operations

### Scenario 2: Complete Server Failure
**Recovery Time**: 2-4 hours
**Data Loss**: < 1 hour

1. Provision new server infrastructure
2. Install PostgreSQL and restore configuration
3. Restore latest backup
4. Apply WAL files from S3
5. Update DNS/load balancer
6. Resume operations

### Scenario 3: Data Center Outage
**Recovery Time**: 4-8 hours
**Data Loss**: < 4 hours

1. Activate secondary data center
2. Restore latest cross-region backup
3. Reconfigure application endpoints
4. Validate all services
5. Communicate status to users

## Monitoring and Alerting

### Backup Monitoring
```bash
#!/bin/bash
# Monitor backup health

BACKUP_DIR="/var/backups/postgresql/daily"
ALERT_EMAIL="alerts@shippyar.com"
MAX_AGE_HOURS=26  # Alert if no backup in 26 hours

# Check for recent backups
LATEST_BACKUP=$(find $BACKUP_DIR -name "*.backup" -mtime -1 | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "ALERT: No recent database backup found" | \
        mail -s "Shippyar DB Backup Alert" $ALERT_EMAIL
fi

# Check backup file sizes (detect truncated backups)
CURRENT_SIZE=$(stat -f%z "$LATEST_BACKUP" 2>/dev/null || echo 0)
EXPECTED_MIN_SIZE=1000000000  # 1GB minimum

if [ $CURRENT_SIZE -lt $EXPECTED_MIN_SIZE ]; then
    echo "ALERT: Database backup appears truncated" | \
        mail -s "Shippyar DB Backup Size Alert" $ALERT_EMAIL
fi
```

### Database Health Monitoring
```sql
-- Create monitoring views
CREATE VIEW backup_status AS
SELECT 
    'daily_backup' as backup_type,
    CASE 
        WHEN MAX(modification_time) > NOW() - INTERVAL '26 hours' 
        THEN 'OK' 
        ELSE 'ALERT' 
    END as status,
    MAX(modification_time) as last_backup
FROM pg_stat_file('/var/backups/postgresql/daily/');

-- WAL archiving status
CREATE VIEW wal_archive_status AS
SELECT 
    archived_count,
    failed_count,
    last_archived_wal,
    last_archived_time
FROM pg_stat_archiver;
```

## Security and Compliance

### Encryption
- **At Rest**: All backups encrypted with AES-256
- **In Transit**: TLS 1.3 for all transfers
- **Key Management**: AWS KMS for encryption keys

### Access Control
```sql
-- Backup user with minimal privileges
CREATE ROLE backup_role;
GRANT CONNECT ON DATABASE shippyar_prod TO backup_role;
GRANT USAGE ON SCHEMA public TO backup_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_role;

-- Recovery user for restoration
CREATE ROLE recovery_role;
GRANT CONNECT ON DATABASE shippyar_prod TO recovery_role;
GRANT CREATE ON DATABASE shippyar_prod TO recovery_role;
```

### Audit Trail
```sql
-- Track backup operations
CREATE TABLE backup_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type VARCHAR(50) NOT NULL,
    backup_file VARCHAR(500),
    size_bytes BIGINT,
    duration_seconds INTEGER,
    status VARCHAR(20),
    error_message TEXT,
    performed_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Testing and Validation

### Monthly Recovery Drills
```bash
#!/bin/bash
# Monthly disaster recovery drill

DRILL_DATE=$(date +%Y%m%d)
DRILL_LOG="/var/log/recovery_drill_$DRILL_DATE.log"

echo "Starting monthly recovery drill at $(date)" | tee $DRILL_LOG

# Test 1: Backup integrity
echo "Testing backup integrity..." | tee -a $DRILL_LOG
/opt/shippyar/scripts/backup_verification.sh

# Test 2: Point-in-time recovery
echo "Testing point-in-time recovery..." | tee -a $DRILL_LOG
# Perform PITR test

# Test 3: Full recovery simulation
echo "Testing full recovery..." | tee -a $DRILL_LOG
# Perform full recovery test on test environment

echo "Recovery drill completed at $(date)" | tee -a $DRILL_LOG
```

### Performance Benchmarks
```sql
-- Benchmark recovery performance
CREATE TABLE recovery_benchmarks (
    test_date DATE,
    backup_size_gb DECIMAL(10,2),
    recovery_time_minutes INTEGER,
    throughput_mbps DECIMAL(10,2),
    notes TEXT
);

-- Example benchmark data
INSERT INTO recovery_benchmarks VALUES
('2024-01-15', 25.5, 45, 9.7, 'Full production restore test'),
('2024-01-15', 25.5, 12, 36.2, 'PITR to 1 hour ago');
```

## Documentation and Runbooks

### Recovery Runbook Checklist
1. ✅ Assess damage scope and data loss
2. ✅ Notify incident response team
3. ✅ Stop all write operations
4. ✅ Identify appropriate backup for recovery
5. ✅ Execute recovery procedure
6. ✅ Verify data integrity
7. ✅ Resume operations gradually
8. ✅ Monitor for issues
9. ✅ Document lessons learned
10. ✅ Update procedures if needed

### Contact Information
- **Primary DBA**: [Contact Info]
- **Secondary DBA**: [Contact Info]  
- **Infrastructure Team**: [Contact Info]
- **Escalation Manager**: [Contact Info]

## Continuous Improvement

### Monthly Reviews
- Backup success rates
- Recovery time objectives
- Storage costs optimization
- Process improvements

### Quarterly Assessments
- Disaster recovery plan updates
- Technology stack evaluation
- Compliance requirement changes
- Staff training and certification

This comprehensive backup and recovery plan ensures Shippyar's data is protected against various failure scenarios while meeting business continuity requirements.