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
      const idMatch = display.label.match(/\(([^)]+)\)$|-\s*([A-Za-z]+-\d+)$/);
      const id = idMatch?.[1] || idMatch?.[2] || "";
      const name = display.label.replace(/\s*\(([^)]+)\)$|\s*-\s*[A-Za-z]+-\d+$/, "").trim();

      return {
        id,
        name,
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
