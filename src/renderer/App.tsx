import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@renderer/providers/theme/provider.js";
import { Toaster } from "@renderer/components/ui/sonner.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs.js";
import { CurrentTabProvider } from "@renderer/providers/current-tab/provider.js";
import { useCurrentTab } from "@renderer/providers/current-tab/hook.js";
import ExploreTab from "@renderer/tabs/explore/index.js";
import SettingsTab from "@renderer/tabs/settings/index.js";
import LibraryTab from "@renderer/tabs/library/index.js";

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
      onValueChange={(value) => setCurrentTab(value as "explore" | "wallpapers" | "settings")}
    >
      <TabsList className="bg-background space-x-2">
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
