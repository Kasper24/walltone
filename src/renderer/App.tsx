import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@renderer/providers/theme-provider";
import { Toaster } from "@renderer/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import ExploreTab from "@renderer/tabs/explore";
import SettingsTab from "@renderer/tabs/settings";
import LibraryTab from "@renderer/tabs/library";
import { CurrentTabProvider, useCurrentTab } from "./providers/current-tab-provider";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <CurrentTabProvider>
          <main className="bg-background h-screen w-screen overflow-hidden select-none">
            <div className="m-10">
              <TabsArea />
              <Toaster></Toaster>
            </div>
          </main>
        </CurrentTabProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const TabsArea = () => {
  const { currentTab, setCurrentTab } = useCurrentTab();

  return (
    <Tabs
      defaultValue="explore"
      className="w-full"
      value={currentTab}
      onValueChange={setCurrentTab}
    >
      <TabsList className="bg-background">
        <TabsTrigger
          value="explore"
          className="bg-background hover:bg-background text-3xl font-black"
        >
          Explore
        </TabsTrigger>
        <TabsTrigger
          value="wallpapers"
          className="bg-background hover:bg-background text-3xl font-black"
        >
          Library
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          className="bg-background hover:bg-background text-3xl font-black"
        >
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="explore">
        <ExploreTab></ExploreTab>
      </TabsContent>
      <TabsContent value="wallpapers">
        <LibraryTab></LibraryTab>
      </TabsContent>
      <TabsContent value="playlists">WIP</TabsContent>
      <TabsContent value="settings">
        <SettingsTab></SettingsTab>
      </TabsContent>
    </Tabs>
  );
};

export default App;
