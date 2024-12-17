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
exports.footballStreamsHandler = exports.footballMetaBuilder = exports.getFootballCatalog = exports.getPpvLandFootballEvents = void 0;
const Sentry = __importStar(require("@sentry/node"));
const dayjs_1 = __importDefault(require("dayjs"));
const redis_1 = require("utils/redis");
// get ppv land footballEvents
const getPpvLandFootballEvents = (_a) => __awaiter(void 0, [_a], void 0, function* ({ search }) {
    var _b;
    const transaction = Sentry.startSpanManual({ name: `Get football catalogue`, op: "http.server" }, (span) => span);
    const matches = yield fetch('https://ppv.land/api/streams');
    const response = yield matches.json();
    const results = (_b = response.streams) !== null && _b !== void 0 ? _b : [];
    const live = results
        .filter(a => a.category.toLowerCase().replace(/ /gi, "-") == 'football'.toLowerCase())
        .map(a => a.streams)
        .flat(2);
    if (search) {
        const regEx = RegExp(search, 'i');
        return live.filter((a) => regEx.test(a.name) || regEx.test(a.category_name) || regEx.test(a.tag)).map((resp) => ({
            id: resp.id.toString(),
            name: resp.name,
            type: 'tv',
            background: resp.poster,
            description: resp.name,
            poster: resp.poster,
            posterShape: 'landscape',
            logo: resp.poster,
        }));
    }
    transaction.end();
    return live.map((resp) => ({
        id: resp.id.toString(),
        name: resp.name,
        type: 'tv',
        background: resp.poster,
        description: resp.name,
        poster: resp.poster,
        posterShape: 'landscape',
        logo: resp.poster,
    }));
});
exports.getPpvLandFootballEvents = getPpvLandFootballEvents;
const getFootballCatalog = (_a) => __awaiter(void 0, [_a], void 0, function* ({ search }) {
    try {
        const now = (0, dayjs_1.default)().tz('Africa/Nairobi').unix();
        const thirtyMinutes = (0, dayjs_1.default)().add(30, 'minutes').unix();
        const footBallCatalog = yield (0, redis_1.getFromCache)('football-catalog');
        const catalog = footBallCatalog.filter(stream => {
            const startsAtMs = dayjs_1.default.unix(stream.time).utc().tz('Africa/Nairobi').unix();
            const endTime = dayjs_1.default.unix(startsAtMs).utc().add(150, 'minutes').tz('Africa/Nairobi').unix();
            // Convert end time to milliseconds
            return (startsAtMs <= now && now < endTime) || // Currently in progress and not ended
                (startsAtMs > now && startsAtMs <= thirtyMinutes); // Starts within 30 minutes
        }).map((a) => ({ id: a.id, name: a.name, type: "tv", posterShape: "landscape", poster: a.poster, logo: a.poster, background: a.poster, description: a.name, }));
        if (search) {
            return catalog.filter((a) => a.name.match(RegExp(search, 'gi')));
        }
        return catalog;
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.getFootballCatalog = getFootballCatalog;
const footballMetaBuilder = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const catalog = (yield (0, exports.getFootballCatalog)({})).find((a) => a.id == id);
        if (!catalog) {
            return {
                id: id,
                name: "N/A",
                description: "N/A",
                type: "tv",
            };
        }
        return {
            id,
            name: catalog.name,
            type: "tv",
            description: catalog.description,
            posterShape: "landscape",
            poster: catalog.poster,
            logo: catalog.logo,
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
exports.footballMetaBuilder = footballMetaBuilder;
const footballStreamsHandler = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const footBallCatalog = yield (0, redis_1.getFromCache)('football-catalog');
        return (_b = (_a = footBallCatalog.find((a) => a.id == id)) === null || _a === void 0 ? void 0 : _a.streams) !== null && _b !== void 0 ? _b : [];
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.footballStreamsHandler = footballStreamsHandler;
