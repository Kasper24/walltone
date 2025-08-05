import {
  Theme as MaterialTheme,
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
} from "@material/material-color-utilities";
import * as chroma from "chroma.ts";

const generateMaterialTheme = (primaryColor: chroma.Color) => {
  const theme = themeFromSourceColor(argbFromHex(primaryColor.hex()));

  return {
    material: {
      dark: getThemeColors(theme, "dark"),
      light: getThemeColors(theme, "light"),
    },
  };
};

const getThemeColors = (theme: MaterialTheme, variant: "light" | "dark") => {
  const colors: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme.schemes[variant].toJSON())) {
    const color = chroma.color(hexFromArgb(value)).hex();
    colors[key] = color;
  }
  return colors;
};

export default generateMaterialTheme;
