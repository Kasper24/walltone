import { protocol, net, app } from "electron";

const registerProtocols = () => {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "video",
      privileges: { bypassCSP: true, standard: true, stream: true },
    },
  ]);

  app.whenReady().then(() => {
    protocol.handle("image", (request) => net.fetch(request.url.replace(`image://`, "file://")));

    protocol.registerFileProtocol("video", (req, callback) => {
      const pathToMedia = decodeURI(req.url.replace("video://", ""));
      callback(pathToMedia);
    });
  });
};

export { registerProtocols };
