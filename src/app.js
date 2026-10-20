import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { corsOrigins } from '#config';
import { errorHandler } from '#middlewares';
import { UPLOAD_DIR } from '#controllers';
import { swaggerSpec } from './docs/swagger.js';

const SWAGGER_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.2';

export class App {
  #config;

  constructor(controller, config) {
    this.#config = config;
    this.app = express();
    this.middleware();
    this.routes(controller);
    this.errorHandling();
  }

  middleware() {
    this.app.use(cors({ origin: corsOrigins, credentials: true }));
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use('/uploads', express.static(UPLOAD_DIR));
  }

  routes(controller) {
    this.app.use('/api', controller.routes());

    this.app.get('/api-docs.json', (_req, res) => {
      res.json(swaggerSpec);
    });

    this.app.get('/api-docs', (_req, res) => {
      res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Swagger UI - 판다마켓 API</title>
  <link rel="stylesheet" href="${SWAGGER_CDN}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_CDN}/swagger-ui-bundle.js"></script>
  <script src="${SWAGGER_CDN}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: 'StandaloneLayout',
      });
    };
  </script>
</body>
</html>`);
    });
  }

  errorHandling() {
    this.app.use(errorHandler);
  }

  listen(port) {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, (error) => {
        if (error) {
          reject(error);
          return;
        }
        console.log(
          `[${this.#config.NODE_ENV}] Server running at http://localhost:${port}`,
        );
        resolve(server);
      });
    });
  }
}

