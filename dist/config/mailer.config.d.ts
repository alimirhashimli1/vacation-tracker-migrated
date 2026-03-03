declare const _default: (() => {
    transport: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    defaults: {
        from: string;
    };
    template: {
        dir: string;
        adapter: any;
        options: {
            strict: boolean;
        };
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    transport: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    defaults: {
        from: string;
    };
    template: {
        dir: string;
        adapter: any;
        options: {
            strict: boolean;
        };
    };
}>;
export default _default;
