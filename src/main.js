"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield core_1.NestFactory.create(app_module_1.AppModule);
        app.useGlobalPipes(new common_1.ValidationPipe());
        // app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)));
        app.enableCors({
            origin: '*', // Allow requests from the frontend
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
        yield app.listen(3000);
    });
}
bootstrap();
