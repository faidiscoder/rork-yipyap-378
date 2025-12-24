module.exports = {
  apps: [
    {
      name: 'yipyap-api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: 'localhost',
        DB_USER: 'root',
        DB_PASSWORD: 'YipYap!2025',
        DB_NAME: 'yip_app',
        DB_PORT: 3306
      },
      
      // Enhanced logging configuration for better readability
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      out_file: '/var/log/yipyap/yipyap-out.log',
      error_file: '/var/log/yipyap/yipyap-error.log',
      combine_logs: true,
      merge_logs: true,
      
      // Log rotation
      log_type: 'json',
      max_log_files: 10,
      max_log_size: '10M',
      
      // Process management
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Advanced PM2 features
      node_args: '--max-old-space-size=2048',
      
      // Custom environment for production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: 'localhost',
        DB_USER: 'root',
        DB_PASSWORD: 'YipYap!2025',
        DB_NAME: 'yip_app',
        DB_PORT: 3306,
        LOG_LEVEL: 'info'
      }
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-lightsail-ip'], // Replace with actual IP
      ref: 'origin/main',
      repo: 'your-git-repo', // Replace with actual repo
      path: '/home/ubuntu/yipyap-api',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/log/yipyap && sudo chown ubuntu:ubuntu /var/log/yipyap'
    }
  }
};