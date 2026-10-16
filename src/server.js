import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import swaggerUi from 'swagger-ui-express';
import { config } from '#config';
import { errorHandler } from '#middlewares';
import { router as apiRouter } from '#routes';
import { imagesRouter, UPLOAD_DIR } from './routes/images.routes.js';
import { swaggerSpec } from './docs/swagger.js';

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api', apiRouter);
app.use('/api/images', imagesRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

export default app;

const isVercelRuntime = Boolean(process.env.VERCEL);

if (!isVercelRuntime) {
  app.listen(config.PORT, () => {
    console.log(
      `[${config.NODE_ENV}] Server running at http://localhost:${config.PORT}`,
    );
  });
}