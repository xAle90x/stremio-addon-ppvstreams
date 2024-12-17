#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
require("dotenv/config");
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
const stremio_addon_sdk_1 = require("stremio-addon-sdk");
const addon_1 = __importDefault(require("./addon"));
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const cronjobs_1 = require("cronjobs");
const dayjs_1 = __importDefault(require("dayjs"));
const cloudinary_1 = require("cloudinary");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(customParseFormat_1.default);
cloudinary_1.v2.config({ api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, cloud_name: process.env.CLOUDINARY_CLOUD_NAME });
Sentry.init({
    dsn: "https://2faaad8d19ae0928c559d1ff0e81f093@o4504167984136192.ingest.us.sentry.io/4508274805374976",
    integrations: [(0, profiling_node_1.nodeProfilingIntegration)()],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
});
cronjobs_1.buildDaddyLiveCatalog.start();
cronjobs_1.fetchFootballFixturesCron.start();
cronjobs_1.fetchRapidFootballEvents.start();
cronjobs_1.FootballScheduleCronBuilder.start();
cronjobs_1.fetchRapidEventsLink.start();
(0, stremio_addon_sdk_1.serveHTTP)(addon_1.default, { port: Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 56397), cacheMaxAge: 60, static: "/public" });
// when you've deployed your addon, un-comment this line
// publishToCentral("https://my-addon.awesome/manifest.json")
// for more information on deploying, see: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/deploying/README.md
