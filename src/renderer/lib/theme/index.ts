import * as chroma from "chroma.ts";
import generateBase16Theme from "./base16.js";
import generateMaterialTheme from "./material.js";

export interface ThemeInterface {
  name: string;
  polarities: {
    name: string;
    colors: {
      name: string;
      color: chroma.Color;
    }[];
  }[];
}

const generateThemes = async (mediaElement: HTMLImageElement | HTMLVideoElement) => {
  if (mediaElement instanceof HTMLVideoElement) {
    const canvas = document.createElement("canvas");
    canvas.width = mediaElement.videoWidth;
    canvas.height = mediaElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    mediaElement = new Image();
    mediaElement.src = dataUrl;
  }

  // Material is good at getting the primary colors from an image,
  // use it for the base16 background colors - as with quantize it
  // can be hard to get a good background color.
  const materialTheme = await generateMaterialTheme(mediaElement);
  const base16Theme = generateBase16Theme(
    mediaElement,
    chroma.color(materialTheme.material.dark.primary)
  );

  return {
    ...base16Theme,
    ...materialTheme,
  };
};

export default generateThemes;
