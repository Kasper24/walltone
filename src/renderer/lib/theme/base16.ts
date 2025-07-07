import * as chroma from "chroma.ts";
import quantize, { ColorMap, RgbPixel } from "quantize";

const base16ColorKeys = [
  "base00",
  "base01",
  "base02",
  "base03",
  "base04",
  "base05",
  "base06",
  "base07",
  "base08",
  "base09",
  "base0A",
  "base0B",
  "base0C",
  "base0D",
  "base0E",
  "base0F",
];

const generateBase16Theme = (img: HTMLImageElement, backgroundColor: chroma.Color) => {
  const colors = adjustColors(getImageColors(img), backgroundColor);

  const darkColors: Record<string, string> = {};
  const lightColors: Record<string, string> = {};

  base16ColorKeys.forEach((key, index) => {
    darkColors[key] = colors.dark[index].hex();
    lightColors[key] = colors.light[index].hex();
  });

  return {
    base16: {
      dark: darkColors,
      light: lightColors,
    },
  };
};

const getImageColors = (img: HTMLImageElement) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  context?.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
  if (!imageData) {
    throw new Error("Failed to get image data");
  }
  const pixelArray = createPixelArray(imageData.data, img.naturalWidth * img.naturalHeight, 10);
  const colorMap = quantize(pixelArray, 100) as ColorMap;
  return (colorMap.palette() as RgbPixel[]).map((color) => chroma.color(color));
};

const createPixelArray = (
  imgData: Uint8ClampedArray,
  pixelCount: number,
  quality: number
): RgbPixel[] => {
  const pixelArray: RgbPixel[] = [];

  for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
    offset = i * 4;
    r = imgData[offset + 0];
    g = imgData[offset + 1];
    b = imgData[offset + 2];
    a = imgData[offset + 3];

    // If pixel is mostly opaque and not white
    if (typeof a === "undefined" || a >= 125) {
      if (!(r > 250 && g > 250 && b > 250)) {
        pixelArray.push([r, g, b]);
      }
    }
  }

  return pixelArray;
};

const adjustColors = (colors: chroma.Color[], backgroundColor: chroma.Color) => {
  const backgroundColors = adjustBackgroundColors(colors, backgroundColor);
  const accentColors = adjustAccentColors(colors);

  return {
    dark: [...backgroundColors.dark, ...accentColors],
    light: [...backgroundColors.light, ...accentColors],
  };
};

const adjustBackgroundColors = (colors: chroma.Color[], backgroundColor: chroma.Color) => {
  const darkBackgroundColors: chroma.Color[] = [];
  const lightBackgroundColors: chroma.Color[] = [];

  const [bgH] = backgroundColor.hsl();
  darkBackgroundColors[0] = colors[0].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.05);
  darkBackgroundColors[1] = colors[1].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.07);
  darkBackgroundColors[2] = colors[2].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.15);
  darkBackgroundColors[3] = colors[3].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.3);
  darkBackgroundColors[4] = colors[4].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.6);
  darkBackgroundColors[5] = colors[5].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.7);
  darkBackgroundColors[6] = colors[6].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.8);
  darkBackgroundColors[7] = colors[7].set("hsl.h", bgH).set("hsl.s", 0.1).set("hsl.l", 0.9);
  lightBackgroundColors[0] = colors[0].set("hsl.h", bgH).set("hsl.s", 1).set("hsl.l", 0.9);
  lightBackgroundColors[1] = colors[1].set("hsl.h", bgH).set("hsl.s", 1).set("hsl.l", 0.85);
  lightBackgroundColors[2] = colors[2].set("hsl.h", bgH).set("hsl.s", 0.4).set("hsl.l", 0.7);
  lightBackgroundColors[3] = colors[3].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.5);
  lightBackgroundColors[4] = colors[4].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.4);
  lightBackgroundColors[5] = colors[5].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.3);
  lightBackgroundColors[6] = colors[6].set("hsl.h", bgH).set("hsl.s", 0.2).set("hsl.l", 0.2);
  lightBackgroundColors[7] = colors[7].set("hsl.h", bgH).set("hsl.s", 0.1).set("hsl.l", 0.1);

  return {
    dark: darkBackgroundColors,
    light: lightBackgroundColors,
  };
};

const adjustAccentColors = (colors: chroma.Color[]) => {
  const accentColors = colors.filter((color) => {
    const [_, saturation, __] = color.hsl();
    const luminance = color.luminance();
    return saturation > 0.3 && luminance > 0.08&& luminance < 0.8;
  });

  return accentColors.length < 8
    ? colors
    : accentColors
        .map((color) => {
          return color.saturate(0.5);
        })
        .slice(0, 8);
};

export default generateBase16Theme;
