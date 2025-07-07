import { client } from "@renderer/lib/trpc";
import { useQuery } from "@tanstack/react-query";

const useWallpaperEngineApiKey = () => {
  return useQuery({
    queryKey: ["wallpaper-engine-api-key"],
    queryFn: async () =>
      await client.settings.get.query({
        key: "wallpaper-engine:api-key",
        decrypt: true,
      }),
  });
};

export default useWallpaperEngineApiKey;
