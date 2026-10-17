import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from '#middlewares';
import { UPLOAD_DIR } from '#controllers';
import { swaggerSpec } from './docs/swagger.js';

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
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use('/uploads', express.static(UPLOAD_DIR));
  }

  routes(controller) {
    this.app.use('/api', controller.routes());
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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
