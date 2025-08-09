import React from "react";
import { Settings } from "lucide-react";
import { HashRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
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
import { Toaster } from "@renderer/components/ui/sonner.js";
import { routes } from "@renderer/routes/index.js";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <main className="bg-background h-screen w-screen overflow-hidden select-none">
          <div className="m-10">
            <HashRouter>
              <NavigationBar />
              <Routes>
                {Object.values(routes).map((route) => (
                  <Route path={route.path} element={route.element} />
                ))}
              </Routes>
            </HashRouter>
            <Toaster />
          </div>
        </main>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const NavigationBar = () => {
  const navigate = useNavigate();
  const navigated = React.useRef(false);

  React.useEffect(() => {
    if (!navigated.current) {
      navigate("/discover/pexels-images");
      navigated.current = true;
    }
  }, [navigate]);

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
      <Button variant="ghost" size="icon">
        <Link to="/settings">
          <Settings />
        </Link>
      </Button>
    </div>
  );
};

const NavigationItem = ({ to, name }: { to: string; name: string }) => {
  return (
    <li>
      <NavigationMenuLink className="text-md" asChild>
        <Link to={to}>{name}</Link>
      </NavigationMenuLink>
    </li>
  );
};

export default App;
