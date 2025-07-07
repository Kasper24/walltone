import { toast } from "sonner";
import { RouterOutputs } from "@electron/trpc/router/base";

type Screen = RouterOutputs["monitor"]["getAll"][number];

export const getCurrentResolution = (screen: Screen) => {
  return screen.modes.reduce((prev, current) =>
    current.refresh_rate > prev.refresh_rate ? current : prev
  );
};

export const getRelativePosition = (screen: Screen, screens: Screen[]) => {
  if (screens.length <= 1) return { left: 0, top: 0, width: 100, height: 100 };

  const minX = Math.min(...screens.map((s) => s.position.x));
  const minY = Math.min(...screens.map((s) => s.position.y));
  const maxX = Math.max(
    ...screens.map((s) => {
      const resolution = getCurrentResolution(s);
      return s.position.x + resolution.width;
    })
  );
  const maxY = Math.max(
    ...screens.map((s) => {
      const resolution = getCurrentResolution(s);
      return s.position.y + resolution.height;
    })
  );

  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;
  const currentResolution = getCurrentResolution(screen);

  return {
    left: ((screen.position.x - minX) / totalWidth) * 100,
    top: ((screen.position.y - minY) / totalHeight) * 100,
    width: (currentResolution.width / totalWidth) * 100,
    height: (currentResolution.height / totalHeight) * 100,
  };
};

export const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.success("Copied to clipboard");
};
