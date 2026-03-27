#!/bin/bash

# Enhanced logging setup for YipYap API on Lightsail
# This script sets up proper logging for PM2 and the application

# Create log directory with proper permissions
sudo mkdir -p /var/log/yipyap
sudo chmod 755 /var/log/yipyap

# Set up log rotation for PM2 logs
cat > /tmp/yipyap-logrotate << 'EOF'
/var/log/yipyap*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        pm2 flush
    endscript
}
EOF

sudo mv /tmp/yipyap-logrotate /etc/logrotate.d/yipyap
sudo chmod 644 /etc/logrotate.d/yipyap

# Install PM2 log rotate module
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:retain 7

# Create a script to monitor and fix PM2 logs if they stop working
cat > /tmp/check-pm2-logs.sh << 'EOF'
#!/bin/bash

# Check if PM2 logs are being written
if ! grep -q "$(date +%Y-%m-%d)" /var/log/yipyap-out.log 2>/dev/null; then
  echo "PM2 logs may not be working, restarting PM2"
  pm2 flush
  pm2 restart all
fi
EOF

sudo mv /tmp/check-pm2-logs.sh /usr/local/bin/check-pm2-logs.sh
sudo chmod +x /usr/local/bin/check-pm2-logs.sh

# Add to crontab to run every hour
(crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/check-pm2-logs.sh") | crontab -

# Create a script to tail logs in real-time with highlighting
cat > /tmp/tail-yipyap-logs.sh << 'EOF'
#!/bin/bash

# Function to display usage
usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -e, --error    Show only error logs"
  echo "  -i, --info     Show only info logs"
  echo "  -w, --warn     Show only warning logs"
  echo "  -a, --all      Show all logs (default)"
  echo "  -h, --help     Show this help message"
  exit 1
}

# Default to showing all logs
LOG_TYPE="all"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--error)
      LOG_TYPE="error"
      shift
      ;;
    -i|--info)
      LOG_TYPE="info"
      shift
      ;;
    -w|--warn)
      LOG_TYPE="warn"
      shift
      ;;
    -a|--all)
      LOG_TYPE="all"
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Set up colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "Tailing YipYap logs (${LOG_TYPE})..."
echo "Press Ctrl+C to exit"

# Tail the logs with color highlighting based on log level
if [ "$LOG_TYPE" = "all" ]; then
  tail -f /var/log/yipyap-out.log | while read line; do
    if echo "$line" | grep -q '"level":"error"'; then
      echo -e "${RED}$line${NC}"
    elif echo "$line" | grep -q '"level":"warn"'; then
      echo -e "${YELLOW}$line${NC}"
    elif echo "$line" | grep -q '"level":"info"'; then
      echo -e "${GREEN}$line${NC}"
    else
      echo "$line"
    fi
  done
elif [ "$LOG_TYPE" = "error" ]; then
  tail -f /var/log/yipyap-out.log | grep --line-buffered '"level":"error"' | while read line; do
    echo -e "${RED}$line${NC}"
  done
elif [ "$LOG_TYPE" = "warn" ]; then
  tail -f /var/log/yipyap-out.log | grep --line-buffered '"level":"warn"' | while read line; do
    echo -e "${YELLOW}$line${NC}"
  done
elif [ "$LOG_TYPE" = "info" ]; then
  tail -f /var/log/yipyap-out.log | grep --line-buffered '"level":"info"' | while read line; do
    echo -e "${GREEN}$line${NC}"
  done
fi
EOF

sudo mv /tmp/tail-yipyap-logs.sh /usr/local/bin/tail-yipyap-logs
sudo chmod +x /usr/local/bin/tail-yipyap-logs

echo "YipYap logging setup complete!"
echo "Use 'tail-yipyap-logs' to view logs in real-time"
echo "Use 'tail-yipyap-logs --error' to view only error logs"