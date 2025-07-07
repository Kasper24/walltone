import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import LibraryImageTab from "@renderer/tabs/library/tabs/image";
import LibraryVideoTab from "@renderer/tabs/library/tabs/video";
import LibraryWallpaperEngineTab from "@renderer/tabs/library/tabs/wallpaper-engine";

const LibraryTab = () => {
  return (
    <Tabs defaultValue="images" className="w-full">
      <TabsList className="bg-background">
        <TabsTrigger
          value="images"
          className="bg-background hover:bg-background text-xl font-black"
        >
          Images
        </TabsTrigger>
        <TabsTrigger
          value="videos"
          className="bg-background hover:bg-background text-xl font-black"
        >
          Videos
        </TabsTrigger>
        <TabsTrigger
          value="wallpaper-engine"
          className="bg-background hover:bg-background text-xl font-black"
        >
          Wallpaper Engine
        </TabsTrigger>
      </TabsList>
      <TabsContent value="images">
        <LibraryImageTab></LibraryImageTab>
      </TabsContent>
      <TabsContent value="videos">
        <LibraryVideoTab></LibraryVideoTab>
      </TabsContent>
      <TabsContent value="wallpaper-engine">
        <LibraryWallpaperEngineTab></LibraryWallpaperEngineTab>
      </TabsContent>
    </Tabs>
  );
};

export default LibraryTab;
