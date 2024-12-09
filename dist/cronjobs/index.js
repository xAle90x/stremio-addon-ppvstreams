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
exports.buildCatalogCron = new cron_1.CronJob("0 1,8,16 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const channels = yield (0, streams_1.fetchWorldWideSportStreams)();
    const events = (yield (0, streams_1.fetchDaddyliveSchedule)());
    const filtered = events.reduce((total, current) => {
        const exists = channels.filter((a) => (0, index_1.compareDaddyliveStreams)(a.name, current.channels));
        if ((exists === null || exists === void 0 ? void 0 : exists.length) > 0) {
            total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams).flat(), time: current.date });
        }
        return total;
    }, []);
    (0, redis_1.saveToCache)('catalog', JSON.stringify(filtered), 12 * 60 * 60);
}));
