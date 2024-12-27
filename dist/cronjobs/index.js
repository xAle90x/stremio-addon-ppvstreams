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
exports.FootballScheduleCronBuilder = exports.fetchRapidEventsLink = exports.fetchRapidFootballEvents = exports.fetchFootballFixturesCron = exports.buildDaddyLiveCatalog = exports.prismaClient = void 0;
const streams_1 = require("api/streams");
const cron_1 = require("cron");
const redis_1 = require("utils/redis");
const cricket_1 = require("catalogs/cricket");
const poster_1 = require("utils/poster");
const dayjs_1 = __importDefault(require("dayjs"));
const Sentry = __importStar(require("@sentry/node"));
const football_1 = require("catalogs/football");
const similarity_1 = __importDefault(require("similarity"));
const client_1 = require("@prisma/client");
exports.prismaClient = new client_1.PrismaClient();
const DaddyliveCronjob = Sentry.cron.instrumentCron(cron_1.CronJob, "daddyliveCronjobs");
exports.buildDaddyLiveCatalog = new DaddyliveCronjob("27 16 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    // export const buildDaddyLiveCatalog = new DaddyliveCronjob("0 1,8,16,20 * * *", async () => {
    try {
        yield exports.prismaClient.$connect();
        console.log("i start");
        const events = (yield (0, streams_1.fetchDaddyliveSchedule)());
        const cricket = yield (0, cricket_1.cricketRapidApiSchedule)();
        const filtered = yield events.reduce((totalEvents, current, index) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const total = yield totalEvents;
            try {
                // world wide channels is channels
                // current event channels == current.channels
                const exists = yield exports.prismaClient.channel.findMany({
                    where: {
                        code: {
                            in: current.channels
                        }
                    }
                });
                if ((exists === null || exists === void 0 ? void 0 : exists.length) > 0) {
                    if (current.type == "cricket") {
                        const awayTeam = ((_b = (_a = current.name.split("vs")) === null || _a === void 0 ? void 0 : _a.at(-1)) === null || _b === void 0 ? void 0 : _b.trim());
                        if (awayTeam) {
                            const regEx = RegExp(awayTeam, 'gi');
                            const fixture = cricket.find((a) => a.team_a.match(regEx) || a.team_b.match(regEx));
                            if (fixture) {
                                const poster = yield (0, poster_1.createEventPoster)(fixture.team_a_img, fixture.team_b_img);
                                total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => ({ behaviorHints: { notWebReady: true, }, url: a.link, name: a.name, title: a.language, })), time: current.date, poster });
                            }
                            else
                                total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => ({ behaviorHints: { notWebReady: true, }, url: a.link, name: a.name, title: a.language, })), time: current.date });
                        }
                        else
                            total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => ({ behaviorHints: { notWebReady: true, }, url: a.link, name: a.name, title: a.language, })), time: current.date });
                    }
                    else if (current.type == "soccer") {
                        const [league, teams] = current.name.split(" : ");
                        const [homeTeam, awayTeam] = teams.split("vs");
                        const name = `${league}: ${homeTeam === null || homeTeam === void 0 ? void 0 : homeTeam.trim()} vs ${awayTeam === null || awayTeam === void 0 ? void 0 : awayTeam.trim()}`;
                        total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: name, description: current.name, type: "football", streams: exists.map((a) => ({ behaviorHints: { notWebReady: true, }, url: a.link, name: a.name, title: a.language, })), time: current.date });
                    }
                    else
                        total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => ({ behaviorHints: { notWebReady: true, }, url: a.link, name: a.name, title: a.language, })), time: current.date });
                }
                console.log(`Finished ${index} of ${total.length}`);
                return total;
            }
            catch (error) {
                Sentry.captureException(error);
                return total;
            }
        }), Promise.resolve([]));
        console.log(filtered);
        (0, redis_1.saveToCache)('catalog', JSON.stringify(filtered), 12 * 60 * 60);
        console.log('catalog built');
    }
    catch (error) {
        console.log(error);
        Sentry.captureException(error);
    }
}));
const FetchFixturesCron = Sentry.cron.instrumentCron(cron_1.CronJob, "fetchFixtureCronjob");
exports.fetchFootballFixturesCron = new FetchFixturesCron("00 05 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const footballEvents = yield (0, streams_1.fetchFootballHighlightEvents)();
        const events = yield footballEvents.reduce((all, current) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const total = yield all;
            const poster = yield (0, poster_1.createFootbalPoster)({
                homeTeam: (_a = current.homeTeam.logo) !== null && _a !== void 0 ? _a : "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
                awayTeam: (_c = (_b = current === null || current === void 0 ? void 0 : current.awayTeam) === null || _b === void 0 ? void 0 : _b.logo) !== null && _c !== void 0 ? _c : "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
                league: (_e = (_d = current === null || current === void 0 ? void 0 : current.league) === null || _d === void 0 ? void 0 : _d.logo) !== null && _e !== void 0 ? _e : "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images"
            });
            total.push({ awayTeam: (_f = current.awayTeam.name) !== null && _f !== void 0 ? _f : "Away team", homeTeam: (_g = current.homeTeam.name) !== null && _g !== void 0 ? _g : "Home team", poster, id: current.id.toString(), league: (_j = (_h = current === null || current === void 0 ? void 0 : current.league) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : "League", name: `${(_k = current === null || current === void 0 ? void 0 : current.homeTeam) === null || _k === void 0 ? void 0 : _k.name} vs ${(_l = current === null || current === void 0 ? void 0 : current.awayTeam) === null || _l === void 0 ? void 0 : _l.name}`, time: dayjs_1.default.tz(current.date).utc(true).unix(), logo: (_m = current.league.logo) !== null && _m !== void 0 ? _m : "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images" });
            return total;
        }), Promise.resolve([]));
        yield (0, redis_1.saveToCache)('football-highlight-events', JSON.stringify(events), 26 * 60 * 60);
    }
    catch (error) {
        Sentry.captureException(error);
    }
}));
const EventsApiCronWithCheckIn = Sentry.cron.instrumentCron(cron_1.CronJob, "fetchRapidFootballEvents");
exports.fetchRapidFootballEvents = new EventsApiCronWithCheckIn("*/28 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield exports.prismaClient.$connect();
        const events = yield (0, streams_1.fetchfootballLiveStreamEvents)();
        for (let index = 0; index < events.length; index++) {
            const a = events[index];
            const [day, month, year] = a.date.split("/");
            const date = dayjs_1.default.tz(`${year}-${month}-${day} ${a.time}`, 'Asia/Yangon').utc().unix();
            // check if event exist
            const event = yield exports.prismaClient.rapidFootballCatalogue.findUnique({
                where: {
                    eventId: a.id
                }
            });
            // if event exists update
            if (event) {
                if (!event.link && a.status == "Live") {
                    const url = yield (0, streams_1.fetchRapidFootballeventLink)(event.id, process.env.RAPID_LIVE_FOOTBALL_API_3);
                    if (url && url != "") {
                        yield exports.prismaClient.rapidFootballCatalogue.update({
                            where: {
                                id: event.id
                            },
                            data: {
                                link: url
                            }
                        });
                    }
                }
            }
            else {
                yield exports.prismaClient.rapidFootballCatalogue.create({
                    data: { awayTeam: a.away_name, eventId: a.id, homeTeam: a.home_name, name: `${a.home_name} vs ${a.away_name}`, status: a.status, date: date },
                });
            }
        }
        yield exports.prismaClient.$disconnect();
    }
    catch (error) {
        Sentry.captureException(error);
    }
}));
const FetchRapidEventCron = Sentry.cron.instrumentCron(cron_1.CronJob, "FetchRapidEventLinkCron");
exports.fetchRapidEventsLink = new FetchRapidEventCron("*/15 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield exports.prismaClient.$connect();
        const currentTime = (0, dayjs_1.default)().utc().unix();
        const events = yield exports.prismaClient.rapidFootballCatalogue.findMany({
            where: {
                link: {
                    isSet: false
                },
            },
        });
        const missingLinks = events.filter((event) => {
            const endTime = dayjs_1.default.unix(event.date).add(145, 'minutes').utc().unix();
            // check event has not ended
            if (currentTime > endTime) {
                return false;
            }
            else {
                // check event has started
                if (currentTime >= event.date || currentTime >= dayjs_1.default.unix(event.date).utc().unix()) {
                    return true;
                }
                else
                    return false;
            }
        });
        for (let index = 0; index < missingLinks.length; index++) {
            const link = yield (0, streams_1.fetchRapidFootballeventLink)(missingLinks[index].eventId, process.env.RAPID_LIVE_FOOTBALL_API_2);
            if (link != null && link != "")
                yield exports.prismaClient.rapidFootballCatalogue.update({
                    where: {
                        eventId: missingLinks[index].eventId
                    }, data: { link }
                });
        }
        yield exports.prismaClient.$disconnect();
    }
    catch (error) {
        Sentry.captureException(error);
    }
}));
const FixtureScheduleCron = Sentry.cron.instrumentCron(cron_1.CronJob, "footballScheduleCronjob");
exports.FootballScheduleCronBuilder = new FixtureScheduleCron("*/10 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const currentTime = (0, dayjs_1.default)().utc().unix();
        yield exports.prismaClient.$connect();
        const daddyLiveEvent = (yield (0, redis_1.getFromCache)('catalog')).filter((a) => a.type == "football" || a.type == "soccer");
        const footballHighlightEvents = (_a = yield (0, redis_1.getFromCache)('football-highlight-events')) !== null && _a !== void 0 ? _a : [];
        const rapidApiEvents = (yield exports.prismaClient.rapidFootballCatalogue.findMany({
            where: {
                link: {
                    isSet: true
                }
            }
        })).filter((event) => {
            const endTime = dayjs_1.default.unix(event.date).add(145, 'minutes').utc().unix();
            // check event has not ended
            if (currentTime > endTime) {
                return false;
            }
            else {
                // check event has started
                if (currentTime >= event.date || currentTime >= dayjs_1.default.unix(event.date).utc().unix()) {
                    return true;
                }
                else
                    return false;
            }
        });
        const ppvLandFootballFixture = yield (0, football_1.getPpvLandFootballEvents)({});
        const footballEvents = yield footballHighlightEvents.reduce((promise, current) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            // daddylive streams
            const total = yield promise;
            const daddyliveStreams = (_b = (_a = daddyLiveEvent.find((a) => {
                var _a, _b;
                const teams = (_a = a.name.split(":")) === null || _a === void 0 ? void 0 : _a.at(-1);
                const [homeTeam, awayTeam] = teams.split("vs");
                return ((0, similarity_1.default)(current.homeTeam.trim(), homeTeam === null || homeTeam === void 0 ? void 0 : homeTeam.trim()) > 0.9) || ((0, similarity_1.default)((_b = current.awayTeam) === null || _b === void 0 ? void 0 : _b.trim(), awayTeam === null || awayTeam === void 0 ? void 0 : awayTeam.trim()) > 0.9);
            })) === null || _a === void 0 ? void 0 : _a.streams) !== null && _b !== void 0 ? _b : [];
            // ppv land exits
            const streams = [];
            const existsPvvLand = ppvLandFootballFixture.find((a) => {
                var _a;
                const teams = (_a = a.name.split(":")) === null || _a === void 0 ? void 0 : _a.at(-1);
                const [homeTeam, awayTeam] = teams.split("vs");
                return ((0, similarity_1.default)(current.homeTeam.trim(), homeTeam.trim()) > 0.9) || ((0, similarity_1.default)(current.awayTeam.trim(), awayTeam.trim()) > 0.9);
            });
            if (existsPvvLand) {
                const stream = yield (0, streams_1.getPPvLandStreams)(existsPvvLand.id);
                streams.push(...stream);
            }
            const rapidStreams = rapidApiEvents.find((a) => {
                var _a, _b, _c, _d;
                return (0, similarity_1.default)((_a = a.homeTeam) === null || _a === void 0 ? void 0 : _a.trim(), (_b = current.homeTeam) === null || _b === void 0 ? void 0 : _b.trim()) > 0.8 || (0, similarity_1.default)((_c = a.awayTeam) === null || _c === void 0 ? void 0 : _c.trim(), (_d = current.awayTeam) === null || _d === void 0 ? void 0 : _d.trim()) > 0.8;
            });
            if (daddyliveStreams != null && (daddyliveStreams === null || daddyliveStreams === void 0 ? void 0 : daddyliveStreams.length) > 0) {
                streams.push(...daddyliveStreams);
            }
            if (rapidStreams) {
                streams.push({ name: current.name, externalUrl: rapidStreams.link, title: "SD", url: rapidStreams.link, behaviorHints: { notWebReady: true } });
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
    }
    catch (error) {
        Sentry.captureException(error);
    }
    // for each event reduce and build catalog
}));
