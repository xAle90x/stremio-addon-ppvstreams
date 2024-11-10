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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const Sentry = __importStar(require("@sentry/node"));
const stremio_addon_sdk_1 = require("stremio-addon-sdk");
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
    id: 'community.ppvstreams',
    version: '0.0.1',
    catalogs: [
        { id: 'basketball', type: 'channel', name: 'Live Basksetball matches' },
        { id: 'football', name: 'Live Football matches', type: 'channel' },
        { id: 'Arm Wrestling', name: 'Live Arm Wrestling evens', type: 'channel' },
        { id: 'Rugby', name: 'Live rugby matches', type: 'channel' },
        { id: 'NFL', name: 'Live nfl matches', type: 'channel' },
        {
            id: 'Darts',
            name: 'Live darts events around the world',
            type: 'channel',
        },
    ],
    resources: [
        { name: 'stream', types: ['channel'] },
        { name: 'meta', types: ['channel'] },
    ],
    types: ['channel'],
    name: 'ppvstreams',
    description: 'Watch live sports events and ppv streams from ppv land',
};
function getLiveFootballCatalog(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const matches = yield fetch('https://ppv.land/api/streams');
            const response = yield matches.json();
            const results = (_a = response.streams) !== null && _a !== void 0 ? _a : [];
            const live = results
                .filter(a => a.category.toLowerCase() == id.toLowerCase())
                .map(a => a.streams)
                .flat(2);
            return live;
        }
        catch (error) {
            Sentry.captureException(error);
            return [];
        }
    });
}
function getMovieStreams(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const streams = yield fetch(`https://ppv.land/api/streams/${id}`);
            const response = yield streams.json();
            return [
                {
                    name: response.data.name,
                    url: response.data.source,
                    title: response.data.tag,
                    behaviorHints: { notWebReady: true },
                },
            ];
        }
        catch (error) {
            Sentry.captureException(error);
            return [];
        }
    });
}
function getMovieMetaDetals(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const streams = yield fetch(`https://ppv.land/api/streams/${id}`);
            const response = yield streams.json();
            return {
                name: response.data.name,
                id: id,
                type: 'channel',
                poster: response.data.poster,
                posterShape: 'landscape',
                background: response.data.poster,
                language: 'english',
                website: response.data.source,
            };
        }
        catch (error) {
            Sentry.captureException(error);
            return { id: id, name: 'N/A', type: 'channel' };
        }
    });
}
const builder = new stremio_addon_sdk_1.addonBuilder(manifest);
builder.defineCatalogHandler((_a) => __awaiter(void 0, [_a], void 0, function* ({ id }) {
    const results = (yield getLiveFootballCatalog(id)).map(resp => ({
        id: resp.id.toString(),
        name: resp.name,
        type: 'channel',
        background: resp.poster,
        description: resp.name,
        poster: resp.poster,
        posterShape: 'landscape',
        logo: resp.poster,
    }));
    return {
        metas: results,
    };
}));
builder.defineMetaHandler((_a) => __awaiter(void 0, [_a], void 0, function* ({ id }) {
    const meta = yield getMovieMetaDetals(id);
    return {
        meta,
    };
}));
builder.defineStreamHandler((_a) => __awaiter(void 0, [_a], void 0, function* ({ id }) {
    const streams = yield getMovieStreams(id);
    return {
        streams,
    };
}));
exports.default = builder.getInterface();
