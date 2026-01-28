module.exports = {
    apps: [{
        name: 'ai-brain',
        script: 'dist/app.js',
        cwd: '/var/www/calling/services/ai-brain',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',

        // Graceful shutdown
        kill_timeout: 5000,
        wait_ready: true,
        listen_timeout: 10000,

        // Prevent rapid restarts
        min_uptime: 5000,
        max_restarts: 10,
        restart_delay: 3000,

        // Environment
        env: {
            NODE_ENV: 'production',
            PORT: 4000
        },

        // Logging
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        error_file: '/var/log/ai-brain/error.log',
        out_file: '/var/log/ai-brain/out.log',
        merge_logs: true,

        // Don't auto-restart on these signals
        shutdown_with_message: true
    }]
};
