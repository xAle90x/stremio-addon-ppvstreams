import axios from "axios";
import { createCanvas, loadImage } from "canvas"
import {v2 as cloudinary } from 'cloudinary'
import { Readable } from "node:stream";
import * as Sentry from "@sentry/node"

export async function createEventPoster(homeLogo: string,awayLogo: string):Promise<string> {        
    const canvasWidth = 800; // Width of the poster
    const canvasHeight = 400; // Height of the poster
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Fill the background with white color
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Load logos
    const imageA = await axios.get(homeLogo, { responseType: "arraybuffer" })
    const imageB = await axios.get(awayLogo, { responseType: "arraybuffer" })
    const logoA = await loadImage(imageA.data);
    const logoB = await loadImage(imageB.data);

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
    const url:string = await new Promise((resolve) => {
        try {
            const buffer = canvas.toBuffer('image/png');
            const stream = new Readable();
            stream.push(buffer);
            stream.push(null)
            const resulte = cloudinary.uploader.upload_stream({ folder: "ppvstream" }, (err, resp) => {                
                resolve(resp?.secure_url ?? "")
            })
            stream.pipe(resulte)
        } catch (error) {
            Sentry.captureException(error)
            resolve("https://placehold.co/600x400.png")
        }
    })
    return url

}