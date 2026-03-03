"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    const server = app.getHttpServer();
    const router = server._events.request._router;
    if (router) {
        const logger = new common_1.Logger('Routes');
        logger.log('--- Registered Routes ---');
        router.stack.forEach((layer) => {
            if (layer.route) {
                const path = layer.route.path;
                const method = Object.keys(layer.route.methods)[0].toUpperCase();
                logger.log(`${method} ${path}`);
            }
        });
        logger.log('-------------------------');
    }
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map