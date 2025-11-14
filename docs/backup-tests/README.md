# Backup Test Reports

This directory contains quarterly backup restoration test reports.

## Directory Structure

```
backup-tests/
├── README.md (this file)
├── 2024-Q1-backup-test.md
├── 2024-Q2-backup-test.md
├── 2024-Q3-backup-test.md
├── 2024-Q4-backup-test.md
└── [YEAR]-Q[X]-backup-test.md
```

## Naming Convention

Test reports should follow this naming convention:
- Format: `YYYY-QX-backup-test.md`
- Example: `2024-Q1-backup-test.md`

## Report Template

Use the template provided in [BACKUP_TESTING_SCHEDULE.md](../../BACKUP_TESTING_SCHEDULE.md) for consistency.

## Automated Report Generation

The test script `scripts/test-restoration.sh` automatically generates reports with the filename:
- Format: `restoration-test-report-YYYYMMDD-HHMMSS.md`

After review, rename and move the report to this directory:

```bash
# Example
mv restoration-test-report-20240115-143022.md docs/backup-tests/2024-Q1-backup-test.md
```

## Test History

| Quarter | Test Date | Status | Tester | Report |
|---------|-----------|--------|--------|--------|
| 2024-Q1 | 2024-01-15 | ✅ PASS | System | [2024-Q1-backup-test.md](./2024-Q1-backup-test.md) |
| 2024-Q2 | - | Pending | - | - |
| 2024-Q3 | - | Pending | - | - |
| 2024-Q4 | - | Pending | - | - |

## Quick Links

- [Backup Setup Guide](../../BACKUP_SETUP.md)
- [Backup Restoration Guide](../../BACKUP_RESTORATION.md)
- [Backup Testing Schedule](../../BACKUP_TESTING_SCHEDULE.md)
- [Test Script](../../scripts/test-restoration.sh)

## Notes

- Test reports should be reviewed by at least one admin
- Failed tests must be investigated and re-tested within 1 week
- Update the test history table above after each test
- Archive reports for at least 2 years for audit purposes
