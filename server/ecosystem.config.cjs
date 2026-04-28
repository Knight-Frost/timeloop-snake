module.exports = {
  apps: [
    {
      name: 'timeloop-snake',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      max_memory_restart: '300M',
      autorestart: true,
      watch: false
    }
  ]
};
