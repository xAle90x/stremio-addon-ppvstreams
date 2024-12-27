"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cricketCatalogBuilder = void 0;
const Sentry = __importStar(require("@sentry/node"));
const dayjs_1 = __importDefault(require("dayjs"));
const redis_1 = require("utils/redis");
const cricketCatalogBuilder = (_a) => __awaiter(void 0, [_a], void 0, function* ({ search }) {
    try {
        const now = dayjs_1.default.tz((0, dayjs_1.default)().utc(), 'Africa/Nairobi').unix();
        const thirtyMinutes = dayjs_1.default.tz((0, dayjs_1.default)().utc(), 'Africa/Nairobi').add(45, 'minutes').unix();
        const cacheExist = yield (0, redis_1.getFromCache)('catalog');
        if (!cacheExist) {
            return [];
        }
        else {
            const matches = cacheExist;
            const filtered = matches.filter((a) => {
                if (a.type == "ice-hockey") {
                    const startsAtMs = a.time;
                    if ((startsAtMs <= now) || (startsAtMs > now && startsAtMs <= thirtyMinutes)) {
                        return true;
                    }
                    return false;
                }
            });
            if (search) {
                return filtered.filter((a) => a.name.match(RegExp(search, 'gi'))).map((a) => (Object.assign(Object.assign({}, a), { type: "tv" })));
            }
            return filtered.map((a) => (Object.assign(Object.assign({}, a), { type: "tv" })));
        }
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.cricketCatalogBuilder = cricketCatalogBuilder;
