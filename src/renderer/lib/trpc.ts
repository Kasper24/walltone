import { createTRPCProxyClient } from "@trpc/client";
import { ipcLink } from "electron-trpc-experimental/renderer";
import { AppRouter } from "@electron/main/trpc/routes/index.js";

const client = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});

export { client };
