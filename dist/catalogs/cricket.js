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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cricketStreamBuilder = exports.cricketMetaBuilder = exports.cricketStreamsBuilder = void 0;
const Sentry = __importStar(require("@sentry/node"));
const redis_1 = require("utils/redis");
const cricketStreamsBuilder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;
        const cacheExist = yield (0, redis_1.getFromCache)('catalog');
        if (!cacheExist) {
            return [];
        }
        else {
            const matches = cacheExist;
            const filtered = matches.filter((a) => {
                if (a.type == "cricket") {
                    const startsAtMs = a.time;
                    if ((startsAtMs <= now) || // Currently in progress
                        (startsAtMs > now && startsAtMs <= now + thirtyMinutes)) // Starts within 30 minutes 
                     {
                        return a;
                    }
                }
            })
                .map((a) => ({
                name: a.name,
                type: "tv",
                description: a.name,
                logo: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.AuYX7CjYL6ge20L2Zd7nQAHaHa%26pid%3DApi&f=1&ipt=41d97734a05f562df01a485180fa285fb0cc26191aa8fa1cda8041e8591e1aae&ipo=images",
                id: a.id,
                poster: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fthumbs.dreamstime.com%2Fb%2Flive-cricket-tournament-poster-banner-design-game-equipments-glossy-blue-background-live-cricket-tournament-poster-135206032.jpg&f=1&nofb=1&ipt=8d940ce9afaad7d99d2cecf5c7cb85a6f02bcd8cccd67cb5678d3008a4f43fa8&ipo=images",
                posterShape: "landscape",
            }));
            return filtered;
        }
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.cricketStreamsBuilder = cricketStreamsBuilder;
const cricketMetaBuilder = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stream = (yield (0, exports.cricketStreamsBuilder)()).find((a) => a.id == id);
        if (stream) {
            return {
                id,
                name: stream.name,
                description: stream.name,
                type: "tv",
                poster: stream.poster,
                posterShape: stream.posterShape,
                country: 'UK',
                language: "English",
                logo: stream.logo,
            };
        }
        return {
            id: id,
            name: "N/A",
            description: "N/A",
            type: "tv",
        };
    }
    catch (error) {
        Sentry.captureException(error);
        return {
            id: id,
            name: "N/A",
            description: "N/A",
            type: "tv",
        };
    }
});
exports.cricketMetaBuilder = cricketMetaBuilder;
const cricketStreamBuilder = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cacheExist = yield (0, redis_1.getFromCache)('catalog');
        if (!cacheExist) {
            return [];
        }
        else {
            const matches = cacheExist;
            const filtered = matches.find((a) => a.id == id);
            if (filtered) {
                return filtered.streams;
            }
            return [];
        }
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.cricketStreamBuilder = cricketStreamBuilder;
