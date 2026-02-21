const app = require('./src/app');
const env = require('./src/config/env');
const prisma = require('./src/config/prisma');
const redisClient = require('./src/config/redis');

let server;
let isShuttingDown = false;

const start = async () => {
  // await redisClient.connect();

  server = app.listen(env.port, () => {
    console.log(`Auth service listening on port ${env.port}`);
  });

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`Received ${signal}, shutting down gracefully...`);

    server.close(async () => {
      try {
        await prisma.$disconnect();

        if (redisClient.isOpen) {
          await redisClient.quit();
          console.log('Redis connection closed');
        }

        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch(async (error) => {
  console.error('Failed to start service:', error);
  await prisma.$disconnect();
  process.exit(1);
});
