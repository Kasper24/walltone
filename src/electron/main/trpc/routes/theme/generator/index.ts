import { parentPort } from "worker_threads";
import { createCanvas, loadImage } from "canvas";
import quantize, { ColorMap } from "quantize";
import {
  argbFromRgb,
  hexFromArgb,
  QuantizerCelebi,
  Score,
} from "@material/material-color-utilities";
import * as chroma from "chroma.ts";
import generateMaterialTheme from "./material.js";
import generateBase16Theme, { Base16Settings } from "./base16.js";

type MaterialPixel = number;
type QuantizePixel = [number, number, number];
type QuantizeLib = "material" | "quantize";

const getImageBytesFromSrc = async (imageSrc: string) => {
  const image = await loadImage(imageSrc);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height).data;
};

const getPixelsFromBytes = (
  imageBytes: Uint8ClampedArray,
  quality: number,
  pixelsFormat: QuantizeLib
) => {
  const pixelCount = imageBytes.length / 4;
  const pixels = [];

  for (let i = 0; i < pixelCount; i += quality) {
    const offset = i * 4;
    const r = imageBytes[offset + 0],
      g = imageBytes[offset + 1],
      b = imageBytes[offset + 2],
      a = imageBytes[offset + 3];

    // Skip transparent or nearly transparent and nearly white pixels
    if (a < 125 || (r > 250 && g > 250 && b > 250)) continue;

    if (pixelsFormat === "material") pixels.push(argbFromRgb(r, g, b));
    else pixels.push([r, g, b]);
  }

  return pixels;
};

const getPrimaryColorFromPixels = (
  pixels: MaterialPixel[] | QuantizePixel[],
  quantizeLib: QuantizeLib
) => {
  if (quantizeLib === "material") {
    const result = QuantizerCelebi.quantize(pixels as MaterialPixel[], 128);
    const ranked = Score.score(result);
    return chroma.color(hexFromArgb(ranked[0]));
  } else {
    const result = quantize(pixels as QuantizePixel[], 4) as ColorMap;
    return chroma.color(result.palette()[0]);
  }
};

const getPaletteFromPixels = (
  pixels: MaterialPixel[] | QuantizePixel[],
  count: number,
  quantizeLib: QuantizeLib
): chroma.Color[] => {
  if (quantizeLib === "material") {
    const materialPalette = QuantizerCelebi.quantize(pixels as MaterialPixel[], count);
    return Array.from(materialPalette.keys()).map((color) => chroma.color(hexFromArgb(color)));
  } else {
    const quantizePalette = quantize(pixels as QuantizePixel[], count) as ColorMap;
    return quantizePalette.palette().map((color) => chroma.color(color));
  }
};

export const generateThemes = async (
  imageSrc: string,
  quantizeLib: QuantizeLib,
  base16Settings: Base16Settings
) => {
  const bytes = await getImageBytesFromSrc(imageSrc);
  const pixels = getPixelsFromBytes(bytes, 1, quantizeLib);
  const primaryColor = getPrimaryColorFromPixels(pixels, quantizeLib);
  const palette = getPaletteFromPixels(pixels, 128, quantizeLib);

  const base16Theme = generateBase16Theme(primaryColor, palette, base16Settings);
  const materialTheme = generateMaterialTheme(primaryColor);

  return {
    ...base16Theme,
    ...materialTheme,
  };
};

parentPort?.on(
  "message",
  async ({
    imageSrc,
    quantizeLibrary,
    base16Settings,
  }: {
    quantizeLibrary: QuantizeLib;
    imageSrc: string;
    base16Settings: Base16Settings;
  }) => {
    try {
      const themes = await generateThemes(imageSrc, quantizeLibrary, base16Settings);
      parentPort?.postMessage({ status: "success", data: themes });
    } catch (error) {
      parentPort?.postMessage({ status: "error", error: (error as Error).message });
    }
  }
);
