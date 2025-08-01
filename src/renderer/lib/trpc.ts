import { createTRPCProxyClient } from "@trpc/client";
import { ipcLink } from "electron-trpc-experimental/renderer";
import { AppRouter } from "@electron/main/trpc/routes/base";

export const client = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});
