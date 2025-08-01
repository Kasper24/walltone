import { useQuery } from "@tanstack/react-query";
import { client } from "@renderer/lib/trpc.js";

const useWallpaperEngineApiKey = () => {
  return useQuery({
    queryKey: ["wallpaper-engine-api-key"],
    queryFn: async () =>
      await client.settings.get.query({
        key: "wallpaperEngine.apiKey",
        decrypt: true,
      }),
  });
};

export default useWallpaperEngineApiKey;
