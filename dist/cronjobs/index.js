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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCatalogCron = void 0;
const streams_1 = require("catalogs/streams");
const cron_1 = require("cron");
const redis_1 = require("utils/redis");
const index_1 = require("utils/index");
const cricket_1 = require("catalogs/cricket");
const poster_1 = require("utils/poster");
exports.buildCatalogCron = new cron_1.CronJob("0 1,8,16 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
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
            else
                total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => (Object.assign(Object.assign({}, b), { name: a.name })))).flat(), time: current.date });
        }
        return total;
    }), Promise.resolve([]));
    (0, redis_1.saveToCache)('catalog', JSON.stringify(filtered), 12 * 60 * 60);
}));
