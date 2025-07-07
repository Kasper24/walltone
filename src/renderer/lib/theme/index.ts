import * as chroma from "chroma.ts";
import generateBase16Theme from "./base16";
import generateMaterialTheme from "./material";

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

const generateThemes = async (img: HTMLImageElement) => {
  // Material is good at getting the primary colors from an image,
  // use it for the base16 background colors - as with quantize it
  // can be hard to get a good background color.
  const materialTheme = await generateMaterialTheme(img);
  const base16Theme = generateBase16Theme(img, chroma.color(materialTheme.material.dark.primary));

  return {
    ...base16Theme,
    ...materialTheme,
  };
};

export default generateThemes;
