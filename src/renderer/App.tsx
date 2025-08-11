import React from "react";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@renderer/components/ui/button.js";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@renderer/components/ui/navigation-menu.js";
import { ThemeProvider } from "@renderer/providers/theme/provider.js";
import { CurrentTabProvider } from "@renderer/providers/current-tab/provider.js";
import { useCurrentTab } from "@renderer/providers/current-tab/hook.js";
import { Toaster } from "@renderer/components/ui/sonner.js";
import { NavigationPaths, routes } from "@renderer/routes/index.js";
import { client } from "@renderer/lib/trpc.js";

const queryClient = new QueryClient();

const App = () => {
  React.useEffect(() => {
    const sub = client.wallpaper.onWallpaperError.subscribe(undefined, {
      onData(data) {
        toast.error(data?.data?.error?.message || "Wallpaper error");
      },
    });
    return () => sub.unsubscribe();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <CurrentTabProvider>
          <main className="bg-background h-screen w-screen overflow-hidden select-none">
            <div className="m-10">
              <NavigationBar />
              <Tabs />
              <Toaster />
            </div>
          </main>
        </CurrentTabProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const NavigationBar = () => {
  const { setCurrentTab } = useCurrentTab();

  return (
    <div className="mb-4 flex items-center justify-between">
      <NavigationMenu viewport={false} className="z-50">
        <NavigationMenuList className="space-x-2">
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-2xl">Discover</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-40">
                <NavigationItem to="/discover/pexels-images" name="Pexels Images" />
                <NavigationItem to="/discover/pexels-videos" name="Pexels Videos" />
                <NavigationItem to="/discover/pixabay-images" name="Pixabay Images" />
                <NavigationItem to="/discover/pixabay-videos" name="Pixabay Videos" />
                <NavigationItem to="/discover/unsplash" name="Unsplash" />
                <NavigationItem to="/discover/wallhaven" name="Wallhaven" />
                <NavigationItem to="/discover/wallpaper-engine" name="Wallpaper Engine" />
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-2xl">Library</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-40">
                <NavigationItem to="/library/images" name="Images" />
                <NavigationItem to="/library/videos" name="Videos" />
                <NavigationItem to="/library/wallpaper-engine" name="Wallpaper Engine" />
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Button variant="ghost" size="icon" onClick={() => setCurrentTab("/settings")}>
        <Settings />
      </Button>
    </div>
  );
};

const NavigationItem = ({ to, name }: { to: NavigationPaths; name: string }) => {
  const { setCurrentTab } = useCurrentTab();

  return (
    <li>
      <NavigationMenuLink className="text-md" onClick={() => setCurrentTab(to)}>
        {name}
      </NavigationMenuLink>
    </li>
  );
};

const Tabs = () => {
  const { currentTab } = useCurrentTab();

  return (
    <>
      {Object.values(routes).map((route) => (
        <div key={route.path} hidden={currentTab !== route.path}>
          {route.element}
        </div>
      ))}
    </>
  );
};

export default App;
