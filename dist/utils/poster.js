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
exports.createEventPoster = createEventPoster;
exports.createFootbalPoster = createFootbalPoster;
const axios_1 = __importDefault(require("axios"));
const canvas_1 = require("canvas");
const cloudinary_1 = require("cloudinary");
const node_stream_1 = require("node:stream");
const Sentry = __importStar(require("@sentry/node"));
function createEventPoster(homeLogo, awayLogo) {
    return __awaiter(this, void 0, void 0, function* () {
        const canvasWidth = 800; // Width of the poster
        const canvasHeight = 400; // Height of the poster
        const canvas = (0, canvas_1.createCanvas)(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        // Fill the background with white color
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        // Load logos
        const imageA = yield axios_1.default.get(homeLogo, { responseType: "arraybuffer" });
        const imageB = yield axios_1.default.get(awayLogo, { responseType: "arraybuffer" });
        const logoA = yield (0, canvas_1.loadImage)(imageA.data);
        const logoB = yield (0, canvas_1.loadImage)(imageB.data);
        // Resize logos if needed
        const logoWidth = 200; // Desired logo width
        const logoHeight = 180; // Desired logo height
        // Calculate positions to center the logos with space between them
        const totalSpace = canvasWidth - 2 * logoWidth; // Space for two logos
        const gap = totalSpace / 3; // Space between logos and sides
        const yCenter = (canvasHeight - logoHeight) / 2; // Center logos vertically
        const xA = gap; // Position of logo A
        const xB = gap * 2 + logoWidth; // Position of logo B
        // Draw logos on canvas
        ctx.drawImage(logoA, xA, yCenter, logoWidth, logoHeight);
        ctx.drawImage(logoB, xB, yCenter, logoWidth, logoHeight);
        // Save the canvas as an image file
        const url = yield new Promise((resolve) => {
            try {
                const buffer = canvas.toBuffer('image/png');
                const stream = new node_stream_1.Readable();
                stream.push(buffer);
                stream.push(null);
                const resulte = cloudinary_1.v2.uploader.upload_stream({ folder: "ppvstream" }, (err, resp) => {
                    var _a;
                    resolve((_a = resp === null || resp === void 0 ? void 0 : resp.secure_url) !== null && _a !== void 0 ? _a : "");
                });
                stream.pipe(resulte);
            }
            catch (error) {
                Sentry.captureException(error);
                resolve("https://placehold.co/600x400.png");
            }
        });
        return url;
    });
}
function createFootbalPoster(_a) {
    return __awaiter(this, arguments, void 0, function* ({ homeTeam, awayTeam, league }) {
        try {
            const posterWidth = 800; // in pixels
            const posterHeight = 400; // in pixels
            // Image dimensions and gap
            const smallImageWidth = 180;
            const smallImageHeight = 180;
            const largeImageWidth = 210;
            const largeImageHeight = 210;
            const gap = 20;
            const canvas = (0, canvas_1.createCanvas)(posterWidth, posterHeight);
            const ctx = canvas.getContext('2d');
            // Fill the background
            ctx.fillStyle = '#ffffff'; // White background
            ctx.fillRect(0, 0, posterWidth, posterHeight);
            // Load the images
            const [img1, img2, img3] = [yield (0, canvas_1.loadImage)((yield axios_1.default.get(homeTeam, { responseType: "arraybuffer" })).data), yield (0, canvas_1.loadImage)((yield axios_1.default.get(league, { responseType: "arraybuffer" })).data), yield (0, canvas_1.loadImage)((yield axios_1.default.get(awayTeam, { responseType: "arraybuffer" })).data)];
            // Calculate positions for the images
            const centerX = posterWidth / 2;
            const centerY = posterHeight / 2;
            const img1X = centerX - largeImageWidth / 2 - smallImageWidth - gap;
            const img1Y = centerY - smallImageHeight / 2;
            const img2X = centerX - largeImageWidth / 2;
            const img2Y = centerY - largeImageHeight / 2;
            const img3X = centerX + largeImageWidth / 2 + gap;
            const img3Y = centerY - smallImageHeight / 2;
            // Draw the images on the canvas
            ctx.drawImage(img1, img1X, img1Y, smallImageWidth, smallImageHeight);
            ctx.drawImage(img2, img2X, img2Y, largeImageWidth, largeImageHeight);
            ctx.drawImage(img3, img3X, img3Y, smallImageWidth, smallImageHeight);
            // Save the canvas to a file
            const url = yield new Promise((resolve) => {
                try {
                    const buffer = canvas.toBuffer('image/png');
                    const stream = new node_stream_1.Readable();
                    stream.push(buffer);
                    stream.push(null);
                    const resulte = cloudinary_1.v2.uploader.upload_stream({ folder: "ppvstream" }, (err, resp) => {
                        var _a;
                        resolve((_a = resp === null || resp === void 0 ? void 0 : resp.secure_url) !== null && _a !== void 0 ? _a : "");
                    });
                    stream.pipe(resulte);
                }
                catch (error) {
                    Sentry.captureException(error);
                    resolve("https://placehold.co/600x400.png");
                }
            });
            return url;
        }
        catch (error) {
            Sentry.captureException(error);
            return "";
        }
    });
}
