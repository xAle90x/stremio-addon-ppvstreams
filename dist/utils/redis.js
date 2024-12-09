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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFromCache = exports.saveToCache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default({ host: process.env.REDIS_HOST, port: Number((_a = process.env.REDIS_PORT) === null || _a === void 0 ? void 0 : _a.toString()), password: process.env.REDIS_PASSWORD, name: process.env.REDIS_DB, username: "default" });
const saveToCache = (id, data, expiry) => __awaiter(void 0, void 0, void 0, function* () {
    yield redis.set(id, data, 'EX', expiry);
});
exports.saveToCache = saveToCache;
const getFromCache = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const record = yield redis.get(id);
    if (!record) {
        return null;
    }
    return JSON.parse(record);
});
exports.getFromCache = getFromCache;
