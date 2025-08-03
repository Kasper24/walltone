import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs.js";
import ExploreUnsplashTab from "@renderer/tabs/explore/tabs/unsplash.js";
import ExplorePexelsImagesTab from "@renderer/tabs/explore/tabs/pexels-images.js";
import ExplorePexelsVideosTab from "@renderer/tabs/explore/tabs/pexels-videos.js";
import ExploreWallhavenTab from "@renderer/tabs/explore/tabs/wallhaven.js";
import ExploreWallpaperEngineTab from "@renderer/tabs/explore/tabs/wallpaper-engine.js";

const ExploreTab = () => {
  return (
    <Tabs defaultValue="unsplash" className="w-full">
      <TabsList className="bg-background space-x-2">
        <TabsTrigger
          value="unsplash"
          className="bg-background hover:bg-background text-xl font-black"
        >
          Unsplash
        </TabsTrigger>
        <TabsTrigger
          value="pexels-images"
          className="bg-background hover:bg-background text-xl font-black"
        >
          Pexels Images
        </TabsTrigger>
        <TabsTrigger
          value="pexels-videos"
          className="bg-background hover:bg-background text-xl font-black"
        >
          Pexels Videos
        </TabsTrigger>
        <TabsTrigger
          value="wallhaven"
          className="bg-background hover:bg-background text-xl font-black"
        >
          Wallhaven
        </TabsTrigger>
        <TabsTrigger
          value="wallpaper-engine"
          className="bg-background hover:bg-background text-xl font-black"
        >
          Wallpaper Engine
        </TabsTrigger>
      </TabsList>

      <TabsContent value="unsplash">
        <ExploreUnsplashTab></ExploreUnsplashTab>
      </TabsContent>
      <TabsContent value="pexels-images">
        <ExplorePexelsImagesTab></ExplorePexelsImagesTab>
      </TabsContent>
      <TabsContent value="pexels-videos">
        <ExplorePexelsVideosTab></ExplorePexelsVideosTab>
      </TabsContent>
      <TabsContent value="wallhaven">
        <ExploreWallhavenTab></ExploreWallhavenTab>
      </TabsContent>
      <TabsContent value="wallpaper-engine">
        <ExploreWallpaperEngineTab></ExploreWallpaperEngineTab>
      </TabsContent>
    </Tabs>
  );
};

export default ExploreTab;
