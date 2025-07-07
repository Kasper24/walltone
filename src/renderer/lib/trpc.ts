import { createTRPCProxyClient } from "@trpc/client";
import { ipcLink } from "electron-trpc-experimental/renderer";
import { AppRouter } from "@electron/trpc/router/base";

export const client = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});
