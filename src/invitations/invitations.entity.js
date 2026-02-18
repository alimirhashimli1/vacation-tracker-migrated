"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invitation = void 0;
const typeorm_1 = require("typeorm");
const role_enum_1 = require("../../../../shared/role.enum");
const invitation_status_enum_1 = require("../../../../shared/invitation-status.enum");
const user_entity_1 = require("../users/user.entity");
let Invitation = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('invitations')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _role_decorators;
    let _role_initializers = [];
    let _role_extraInitializers = [];
    let _token_decorators;
    let _token_initializers = [];
    let _token_extraInitializers = [];
    let _expiresAt_decorators;
    let _expiresAt_initializers = [];
    let _expiresAt_extraInitializers = [];
    let _usedAt_decorators;
    let _usedAt_initializers = [];
    let _usedAt_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _invitedById_decorators;
    let _invitedById_initializers = [];
    let _invitedById_extraInitializers = [];
    let _invitedBy_decorators;
    let _invitedBy_initializers = [];
    let _invitedBy_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    var Invitation = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.email = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.role = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _role_initializers, void 0));
            this.token = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _token_initializers, void 0));
            this.expiresAt = (__runInitializers(this, _token_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
            this.usedAt = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _usedAt_initializers, void 0));
            this.status = (__runInitializers(this, _usedAt_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.invitedById = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _invitedById_initializers, void 0));
            this.invitedBy = (__runInitializers(this, _invitedById_extraInitializers), __runInitializers(this, _invitedBy_initializers, void 0));
            this.createdAt = (__runInitializers(this, _invitedBy_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Invitation");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _email_decorators = [(0, typeorm_1.Column)({ unique: true })];
        _role_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: role_enum_1.Role,
            })];
        _token_decorators = [(0, typeorm_1.Column)()];
        _expiresAt_decorators = [(0, typeorm_1.Column)()];
        _usedAt_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: invitation_status_enum_1.InvitationStatus,
                default: invitation_status_enum_1.InvitationStatus.PENDING,
            })];
        _invitedById_decorators = [(0, typeorm_1.Column)()];
        _invitedBy_decorators = [(0, typeorm_1.ManyToOne)(() => user_entity_1.User), (0, typeorm_1.JoinColumn)({ name: 'invitedById' })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: obj => "role" in obj, get: obj => obj.role, set: (obj, value) => { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
        __esDecorate(null, null, _token_decorators, { kind: "field", name: "token", static: false, private: false, access: { has: obj => "token" in obj, get: obj => obj.token, set: (obj, value) => { obj.token = value; } }, metadata: _metadata }, _token_initializers, _token_extraInitializers);
        __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: obj => "expiresAt" in obj, get: obj => obj.expiresAt, set: (obj, value) => { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
        __esDecorate(null, null, _usedAt_decorators, { kind: "field", name: "usedAt", static: false, private: false, access: { has: obj => "usedAt" in obj, get: obj => obj.usedAt, set: (obj, value) => { obj.usedAt = value; } }, metadata: _metadata }, _usedAt_initializers, _usedAt_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _invitedById_decorators, { kind: "field", name: "invitedById", static: false, private: false, access: { has: obj => "invitedById" in obj, get: obj => obj.invitedById, set: (obj, value) => { obj.invitedById = value; } }, metadata: _metadata }, _invitedById_initializers, _invitedById_extraInitializers);
        __esDecorate(null, null, _invitedBy_decorators, { kind: "field", name: "invitedBy", static: false, private: false, access: { has: obj => "invitedBy" in obj, get: obj => obj.invitedBy, set: (obj, value) => { obj.invitedBy = value; } }, metadata: _metadata }, _invitedBy_initializers, _invitedBy_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Invitation = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Invitation = _classThis;
})();
exports.Invitation = Invitation;
