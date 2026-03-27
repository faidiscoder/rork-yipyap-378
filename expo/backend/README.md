# YipYap API Server

## Logging Setup

The YipYap API server uses structured JSON logging to ensure all events are properly captured by PM2 and can be easily analyzed.

### Viewing Logs

To view logs on the Lightsail instance:

```bash
# View all logs
pm2 logs

# View only YipYap API logs
pm2 logs yipyap-api

# Use the custom log viewer with syntax highlighting
tail-yipyap-logs

# View only error logs
tail-yipyap-logs --error

# View only info logs
tail-yipyap-logs --info
```

### Log Files

Logs are stored in the following locations:

- `/var/log/yipyap-out.log` - Standard output logs
- `/var/log/yipyap-error.log` - Error logs

### Log Format

Logs are stored in JSON format with the following structure:

```json
{
  "timestamp": "2023-06-20T12:34:56.789Z",
  "level": "info|warn|error",
  "message": "Log message",
  "additionalData": "Any additional context"
}
```

### Troubleshooting

If logs are not appearing:

1. Check if PM2 is running: `pm2 status`
2. Check if log files exist: `ls -la /var/log/yipyap*`
3. Restart PM2: `pm2 restart all`
4. Flush PM2 logs: `pm2 flush`
5. Check PM2 log configuration: `pm2 show yipyap-api`

### Log Rotation

Logs are automatically rotated daily and compressed after 7 days to prevent disk space issues.

## API Endpoints

The API server provides the following endpoints:

- `/health` - Health check endpoint
- `/trpc` - tRPC API endpoint
- `/api/trpc` - Alternative tRPC API endpoint for backward compatibility

## Authentication

Authentication is handled via tokens in the Authorization header:

```
Authorization: Bearer auth_token_USER_ID_TIMESTAMP
```

All authentication events are logged for security monitoring.