import { env } from '@/common/utils/envConfig';
import { app, logger, httpServer } from '@/server';
import swaggerUi from 'swagger-ui-express';
// import swaggerFile from '../src/swagger_output.json'; 

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

const server = httpServer.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env;
  logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);
  logger.info(`Swagger docs available at http://${HOST}:${PORT}`);
});

const onCloseSignal = () => {
  logger.info('sigint received, shutting down');
  server.close(() => {
    logger.info('server closed');
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on('SIGINT', onCloseSignal);
process.on('SIGTERM', onCloseSignal);
