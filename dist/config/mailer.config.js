"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
function getEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`${key} is not defined`);
    }
    return value;
}
exports.default = (0, config_1.registerAs)('mailer', () => ({
    transport: {
        host: getEnv('SMTP_HOST'),
        port: parseInt(getEnv('SMTP_PORT'), 10),
        secure: process.env.MAILER_SECURE === 'true',
        auth: {
            user: getEnv('SMTP_USER'),
            pass: getEnv('SMTP_PASSWORD'),
        },
    },
    defaults: {
        from: getEnv('SMTP_FROM'),
    },
    template: {
        dir: process.cwd() + '/src/templates',
        adapter: new (require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter').HandlebarsAdapter)(),
        options: {
            strict: true,
        },
    },
}));
//# sourceMappingURL=mailer.config.js.map