// Описание прод-процесса для pm2 на VPS. Едет вместе со сборкой в
// /var/www/quotes-app/current/ и применяется шагом деплоя в CI.
//
// Секреты здесь не живут: Next при старте сам подхватывает
// /var/www/quotes-app/current/.env.production (см. loadEnvConfig в
// base-server). Этот файл rsync не трогает — он в --exclude.
module.exports = {
  apps: [
    {
      name: 'quotes-app',
      script: '/var/www/quotes-app/current/server.js',
      cwd: '/var/www/quotes-app/current',
      // Один инстанс намеренно: кэш эмбеддингов (~126MB блобов, вдвое больше
      // в памяти) у каждого процесса был бы свой, а на сервере всего 900MB.
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
      max_memory_restart: '700M',
      // Падать молча нельзя, но и крутить рестарт-луп на слабой машине тоже.
      min_uptime: '20s',
      max_restarts: 10,
      restart_delay: 2000,
      merge_logs: true,
      time: true,
    },
  ],
}
