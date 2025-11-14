#!/bin/bash

###############################################################################
# Backup Test Reminder Script
#
# This script sends a reminder to perform the quarterly backup restoration test.
# It should be run 1 week before the scheduled test date.
#
# Usage: ./scripts/send-test-reminder.sh
#
# Can be scheduled via cron:
# 0 9 8 1,4,7,10 * /path/to/send-test-reminder.sh
###############################################################################

# Configuration
CURRENT_MONTH=$(date +%m)
CURRENT_YEAR=$(date +%Y)

# Determine which quarter we're in
case $CURRENT_MONTH in
    01) QUARTER="Q1"; TEST_DATE="January 15" ;;
    04) QUARTER="Q2"; TEST_DATE="April 15" ;;
    07) QUARTER="Q3"; TEST_DATE="July 15" ;;
    10) QUARTER="Q4"; TEST_DATE="October 15" ;;
    *) 
        echo "Not a test reminder month. Exiting."
        exit 0
        ;;
esac

# Email configuration (adjust based on your email service)
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@techsupportcs.com}"
FROM_EMAIL="${FROM_EMAIL:-noreply@techsupportcs.com}"
SUBJECT="Reminder: Quarterly Backup Restoration Test - $QUARTER $CURRENT_YEAR"

# Create email body
EMAIL_BODY=$(cat << EOF
Subject: $SUBJECT

Hello Admin Team,

This is a reminder that the quarterly backup restoration test for $QUARTER $CURRENT_YEAR is scheduled for:

📅 Date: $TEST_DATE, $CURRENT_YEAR
⏰ Time: During maintenance window (recommended: off-peak hours)
📍 Location: Remote (via command line)

Test Procedure:
1. Run the automated test script:
   ./scripts/test-restoration.sh

2. Or follow the manual procedure in:
   BACKUP_TESTING_SCHEDULE.md

3. Complete the test report using the template:
   docs/backup-tests/test-report-template.md

4. Update the test schedule:
   BACKUP_TESTING_SCHEDULE.md

Documentation:
- Backup Setup: BACKUP_SETUP.md
- Restoration Guide: BACKUP_RESTORATION.md
- Testing Schedule: BACKUP_TESTING_SCHEDULE.md

Important Notes:
- This test ensures our backup and recovery system is functioning correctly
- The test uses a separate test database and does not affect production
- Expected duration: 30-45 minutes
- Please complete the test within the scheduled week

If you have any questions or need assistance, please contact the primary admin.

Best regards,
Automated Backup System

---
This is an automated reminder. Do not reply to this email.
EOF
)

# Log the reminder
echo "[$(date)] Sending backup test reminder for $QUARTER $CURRENT_YEAR"

# Send email (adjust based on your email service)
# Option 1: Using sendmail
if command -v sendmail &> /dev/null; then
    echo "$EMAIL_BODY" | sendmail -f "$FROM_EMAIL" "$ADMIN_EMAIL"
    echo "Reminder sent via sendmail to $ADMIN_EMAIL"
fi

# Option 2: Using mail command
if command -v mail &> /dev/null; then
    echo "$EMAIL_BODY" | mail -s "$SUBJECT" "$ADMIN_EMAIL"
    echo "Reminder sent via mail to $ADMIN_EMAIL"
fi

# Option 3: Using curl with SendGrid API
if [ -n "$SENDGRID_API_KEY" ]; then
    curl -X POST https://api.sendgrid.com/v3/mail/send \
        -H "Authorization: Bearer $SENDGRID_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"personalizations\": [{
                \"to\": [{\"email\": \"$ADMIN_EMAIL\"}]
            }],
            \"from\": {\"email\": \"$FROM_EMAIL\"},
            \"subject\": \"$SUBJECT\",
            \"content\": [{
                \"type\": \"text/plain\",
                \"value\": $(echo "$EMAIL_BODY" | jq -Rs .)
            }]
        }"
    echo "Reminder sent via SendGrid to $ADMIN_EMAIL"
fi

# Option 4: Log to file if no email service available
if ! command -v sendmail &> /dev/null && ! command -v mail &> /dev/null && [ -z "$SENDGRID_API_KEY" ]; then
    LOG_FILE="backup-test-reminders.log"
    echo "=== Backup Test Reminder ===" >> "$LOG_FILE"
    echo "Date: $(date)" >> "$LOG_FILE"
    echo "$EMAIL_BODY" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "No email service configured. Reminder logged to $LOG_FILE"
fi

# Create a reminder file
REMINDER_FILE=".backup-test-reminder-$QUARTER-$CURRENT_YEAR"
echo "Backup test reminder for $QUARTER $CURRENT_YEAR" > "$REMINDER_FILE"
echo "Test scheduled for: $TEST_DATE, $CURRENT_YEAR" >> "$REMINDER_FILE"
echo "Reminder sent on: $(date)" >> "$REMINDER_FILE"

echo "Reminder process completed."
