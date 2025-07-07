import { exposeElectronTRPC } from 'electron-trpc-experimental/preload';

process.once("loaded", async () => {
  exposeElectronTRPC();
});
