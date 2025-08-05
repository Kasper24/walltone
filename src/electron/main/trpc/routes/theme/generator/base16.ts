import * as chroma from "chroma.ts";
import { type SettingsSchema } from "@electron/main/trpc/routes/settings.js";

type Base16Settings = SettingsSchema["themeGeneration"]["base16"];

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

const generateBase16Theme = (
  primaryColor: chroma.Color,
  palette: chroma.Color[],
  base16Settings: Base16Settings
) => {
  const colors = adjustColors(primaryColor, palette, base16Settings);

  const darkColors = Object.fromEntries(
    base16ColorKeys.map((key, i) => [key, colors.dark[i].hex()])
  );
  const lightColors = Object.fromEntries(
    base16ColorKeys.map((key, i) => [key, colors.light[i].hex()])
  );

  return {
    base16: {
      dark: darkColors,
      light: lightColors,
    },
  };
};

const adjustColors = (
  primaryColor: chroma.Color,
  palette: chroma.Color[],
  base16Settings: Base16Settings
) => {
  const backgroundColors = adjustBackgroundColors(primaryColor, palette, base16Settings);
  const accentColors = adjustAccentColors(palette, base16Settings);

  return {
    dark: [...backgroundColors.dark, ...accentColors],
    light: [...backgroundColors.light, ...accentColors],
  };
};

const adjustBackgroundColors = (
  primaryColor: chroma.Color,
  palette: chroma.Color[],
  base16Settings: Base16Settings
) => {
  const [bgH] = primaryColor.hsl();

  // Configuration for dark and light theme saturation/lightness levels.
  const levels = {
    dark: [
      { s: 0.2, l: 0.05 },
      { s: 0.2, l: 0.07 },
      { s: 0.2, l: 0.15 },
      { s: 0.2, l: 0.3 },
      { s: 0.2, l: 0.6 },
      { s: 0.2, l: 0.7 },
      { s: 0.2, l: 0.8 },
      { s: 0.1, l: 0.9 },
    ],
    light: [
      { s: 1.0, l: 0.9 },
      { s: 1.0, l: 0.85 },
      { s: 0.4, l: 0.7 },
      { s: 0.2, l: 0.5 },
      { s: 0.2, l: 0.4 },
      { s: 0.2, l: 0.3 },
      { s: 0.2, l: 0.2 },
      { s: 0.1, l: 0.1 },
    ],
  };

  const createVariant = (variant: "dark" | "light") =>
    levels[variant].map((level, i) =>
      palette[i]
        .set("hsl.h", bgH)
        .set("hsl.s", level.s)
        .set("hsl.l", level.l)
        .saturate(base16Settings.backgroundSaturation)
        .darker(base16Settings.backgroundDarken)
        .brighter(base16Settings.backgroundLighten)
    );

  return {
    dark: createVariant("dark"),
    light: createVariant("light"),
  };
};

const adjustAccentColors = (palette: chroma.Color[], base16Settings: Base16Settings) => {
  const accentColors = palette.filter((color) => {
    const [_, saturation, __] = color.hsl();
    const luminance = color.luminance();
    return (
      saturation >= base16Settings.accentMinSaturation &&
      saturation <= base16Settings.accentMaxSaturation &&
      luminance >= base16Settings.accentMinLuminance &&
      luminance <= base16Settings.accentMaxLuminance
    );
  });

  return (accentColors.length < 8 ? palette : accentColors)
    .map((color) => {
      return color
        .saturate(base16Settings.accentSaturation)
        .darker(base16Settings.accentDarken)
        .brighter(base16Settings.accentLighten);
    })
    .slice(0, 8);
};

export default generateBase16Theme;
