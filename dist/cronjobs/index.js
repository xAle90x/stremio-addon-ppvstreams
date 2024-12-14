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
exports.FootballScheduleCronBuilder = exports.fetchRapidFootballEvents = exports.fetchFootballFixturesCron = exports.buildDaddyLiveCatalog = void 0;
const streams_1 = require("api/streams");
const cron_1 = require("cron");
const redis_1 = require("utils/redis");
const index_1 = require("utils/index");
const cricket_1 = require("catalogs/cricket");
const poster_1 = require("utils/poster");
const dayjs_1 = __importDefault(require("dayjs"));
const Sentry = __importStar(require("@sentry/node"));
const football_1 = require("catalogs/football");
// export const buildDaddyLiveCatalog = new CronJob("0 1,8,16 * * *", async () => {
exports.buildDaddyLiveCatalog = new cron_1.CronJob("0 1,8,16 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const channels = yield (0, streams_1.fetchWorldWideSportStreams)();
    const events = (yield (0, streams_1.fetchDaddyliveSchedule)());
    const cricket = yield (0, cricket_1.cricketRapidApiSchedule)();
    const filtered = yield events.reduce((totalEvents, current) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const total = yield totalEvents;
        const exists = channels.filter((a) => (0, index_1.compareDaddyliveStreams)(a.name, current.channels));
        if ((exists === null || exists === void 0 ? void 0 : exists.length) > 0) {
            if (current.type == "cricket") {
                const awayTeam = ((_b = (_a = current.name.split("vs")) === null || _a === void 0 ? void 0 : _a.at(-1)) === null || _b === void 0 ? void 0 : _b.trim());
                if (awayTeam) {
                    const regEx = RegExp(awayTeam, 'gi');
                    const fixture = cricket.find((a) => a.team_a.match(regEx) || a.team_b.match(regEx));
                    if (fixture) {
                        const poster = yield (0, poster_1.createEventPoster)(fixture.team_a_img, fixture.team_b_img);
                        total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => (Object.assign(Object.assign({}, b), { name: a.name })))).flat(), time: current.date, poster });
                    }
                    else
                        total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => (Object.assign(Object.assign({}, b), { name: a.name })))).flat(), time: current.date });
                }
                else
                    total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => (Object.assign(Object.assign({}, b), { name: a.name })))).flat(), time: current.date });
            }
            else if (current.type == "soccer") {
                const [league, teams] = current.name.split(" : ");
                const [homeTeam, awayTeam] = teams.split("vs");
                const name = `${league}: ${homeTeam.trim()} vs ${awayTeam.trim()}`;
                total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: name, description: current.name, type: "football", streams: exists.map((a) => a.streams.map((b) => (Object.assign(Object.assign({}, b), { name: a.name })))).flat(), time: current.date });
            }
            else
                total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => (Object.assign(Object.assign({}, b), { name: a.name })))).flat(), time: current.date });
        }
        return total;
    }), Promise.resolve([]));
    (0, redis_1.saveToCache)('catalog', JSON.stringify(filtered), 12 * 60 * 60);
}));
exports.fetchFootballFixturesCron = new cron_1.CronJob("07 15 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const footballEvents = yield (0, streams_1.fetchFootballHighlightEvents)();
    const events = yield footballEvents.reduce((all, current) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const total = yield all;
        const poster = yield (0, poster_1.createFootbalPoster)({
            homeTeam: (_a = current.homeTeam.logo) !== null && _a !== void 0 ? _a : "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
            awayTeam: (_c = (_b = current === null || current === void 0 ? void 0 : current.awayTeam) === null || _b === void 0 ? void 0 : _b.logo) !== null && _c !== void 0 ? _c : "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
            league: (_e = (_d = current === null || current === void 0 ? void 0 : current.league) === null || _d === void 0 ? void 0 : _d.logo) !== null && _e !== void 0 ? _e : "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images"
        });
        total.push({ awayTeam: (_f = current.awayTeam.name) !== null && _f !== void 0 ? _f : "Away team", homeTeam: (_g = current.homeTeam.name) !== null && _g !== void 0 ? _g : "Home team", poster, id: current.id.toString(), league: (_j = (_h = current === null || current === void 0 ? void 0 : current.league) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : "League", name: `${(_k = current === null || current === void 0 ? void 0 : current.homeTeam) === null || _k === void 0 ? void 0 : _k.name} vs ${(_l = current === null || current === void 0 ? void 0 : current.awayTeam) === null || _l === void 0 ? void 0 : _l.name}`, time: dayjs_1.default.tz(current.date, 'Africa/Nairobi').utc().unix() });
        return total;
    }), Promise.resolve([]));
    yield (0, redis_1.saveToCache)('football-highlight-events', JSON.stringify(events), 26 * 60 * 60);
}));
const EventsApiCronWithCheckIn = Sentry.cron.instrumentCron(cron_1.CronJob, "fetchRapidFootballEvents");
exports.fetchRapidFootballEvents = new EventsApiCronWithCheckIn("30 13 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const footabllEvents = yield (0, streams_1.fetchfootballLiveStreamEvents)();
    yield (0, redis_1.saveToCache)("rapid-football-events", JSON.stringify(footabllEvents), 26 * 60 * 60);
    console.log("finished rapid events");
}));
exports.FootballScheduleCronBuilder = new cron_1.CronJob("*/30 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const footballHighlightEvents = yield (0, redis_1.getFromCache)('football-highlight-events');
    const rapidApiEvents = yield (0, redis_1.getFromCache)('rapid-football-events');
    const ppvLandFootballFixture = yield (0, football_1.getPpvLandFootballEvents)({});
    const daddyLiveEvent = (yield (0, redis_1.getFromCache)('catalog')).filter((a) => a.type == "football" || a.type == "soccer");
    const footballEvents = yield footballHighlightEvents.reduce((promise, current) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // daddylive streams
        const total = yield promise;
        const regex = new RegExp(`${current.homeTeam.trim()} vs ${current.awayTeam.trim()}`, 'gi');
        const daddyliveStreams = (_a = daddyLiveEvent.find((a) => a.name.match(regex))) === null || _a === void 0 ? void 0 : _a.streams;
        // ppv land exits
        const streams = [];
        const existsPvvLand = ppvLandFootballFixture.find((a) => a.name.match(RegExp(`${current.homeTeam} vs ${current.awayTeam}`, 'gi')));
        if (existsPvvLand) {
            const stream = yield (0, streams_1.getPPvLandStreams)(existsPvvLand.id);
            streams.push(...stream);
        }
        const rapidStreams = rapidApiEvents.find((a) => a.home_name.trim().match(RegExp(current.homeTeam.trim(), 'gi')));
        if (daddyliveStreams != null && (daddyliveStreams === null || daddyliveStreams === void 0 ? void 0 : daddyliveStreams.length) > 0) {
            streams.push(...daddyliveStreams);
        }
        if (rapidStreams) {
            streams.push({ name: "SD", externalUrl: rapidStreams.link, title: "SD", url: rapidStreams.link, behaviorHints: { notWebReady: true } });
        }
        if (streams.length > 0) {
            const event = {
                id: `${current.id}-football`,
                time: current.time,
                name: current.name,
                description: current.name,
                poster: current.poster,
                streams
            };
            total.push(event);
        }
        return total;
    }), Promise.resolve([]));
    (0, redis_1.saveToCache)('football-catalog', JSON.stringify(footballEvents), 12 * 60 * 60);
    // for each event reduce and build catalog
}));
