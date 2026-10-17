import { createContainer } from './common/di/container.js';
import { App } from './app.js';

const { controller, config } = createContainer();
const { app } = new App(controller, config);

export default app;
