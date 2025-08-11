import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { screen } from "electron";

export type Monitor = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

export const monitorRouter = router({
  search: publicProcedure.query(async () => {
    const displays = screen.getAllDisplays();
    const monitors: Monitor[] = displays.map((display) => {
      const id = display.label.match(/\((.*?)\)/)?.[1] || "";
      const name = display.label.replace(/\(.*?\)/, "").trim();
      return {
        id,
        name: name,
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.size.width * display.scaleFactor,
        height: display.size.height * display.scaleFactor,
        scale: display.scaleFactor,
      };
    });
    return monitors;
  }),
});
