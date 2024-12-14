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
exports.fetchDaddyliveSchedule = exports.fetchWorldWideSportStreams = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const Sentry = __importStar(require("@sentry/node"));
const dayjs_1 = __importDefault(require("dayjs"));
const redis_1 = require("utils/redis");
const fetchWorldWideSportStreams = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // check if currently exists in cache
        const cache = yield (0, redis_1.getFromCache)('worldwide-events');
        if (cache) {
            return cache;
        }
        else {
            const request = yield fetch('https://848b3516657c-worldwide-sports-tv.baby-beamup.club/catalog/tv/tv.json');
            const response = yield request.json();
            (0, redis_1.saveToCache)('worldwide-events', JSON.stringify(response['metas']), 24 * 60 * 60);
            return (_b = ((_a = response['metas']) !== null && _a !== void 0 ? _a : [])) === null || _b === void 0 ? void 0 : _b.filter((a) => a.genres.includes('UK') || a.genres.includes('USA'));
        }
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.fetchWorldWideSportStreams = fetchWorldWideSportStreams;
const fetchDaddyliveSchedule = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const request = yield fetch('https://thedaddy.to/schedule/schedule-generated.json');
        const response = yield request.json();
        const events = [];
        for (const [key, value] of Object.entries(response)) {
            const dateParts = key.split("-")[0].trim();
            const parts = dateParts.split(" ");
            const year = parts === null || parts === void 0 ? void 0 : parts.at(-1);
            const month = parts === null || parts === void 0 ? void 0 : parts.at(-2);
            const day = (_a = parts === null || parts === void 0 ? void 0 : parts.at(1)) === null || _a === void 0 ? void 0 : _a.slice(0, 2);
            const date = (0, dayjs_1.default)(`${day} ${month} ${year}`);
            const ukDateTime = `${year}-${date.format('MM')}-${day}T`;
            const ukTimezone = "Europe/London";
            // Convert to Kenya timezone (EAT is UTC+3)
            const kenyaTimezone = "Africa/Nairobi";
            for (const [showKey, showValue] of Object.entries(value)) {
                const type = showKey.trim().replace(/ /gi, "-").toLowerCase();
                for (let index = 0; index < showValue.length; index++) {
                    const event = showValue[index];
                    const kenyaUnixTime = dayjs_1.default.tz(`${ukDateTime}${event['time']}:00`, ukTimezone).tz(kenyaTimezone).unix();
                    events.push({ type, date: kenyaUnixTime, name: event.event, channels: Array.isArray(event.channels) ? (_b = event.channels) === null || _b === void 0 ? void 0 : _b.map((a) => a.channel_name) : (_c = Object.values(event.channels)) === null || _c === void 0 ? void 0 : _c.map((a) => a.channel_name) });
                }
            }
        }
        return events;
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.fetchDaddyliveSchedule = fetchDaddyliveSchedule;
