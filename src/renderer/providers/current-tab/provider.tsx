import * as React from "react";
import { routes } from "@renderer/routes/index.js";

type NavigationPaths = (typeof routes)[keyof typeof routes]["path"];

interface CurrentTabContextType {
  currentTab: NavigationPaths;
  setCurrentTab: (currentTab: NavigationPaths) => void;
}

const initialState: CurrentTabContextType = {
  currentTab: "/discover/pexels-images",
  setCurrentTab: () => null,
};

const CurrentTabContext = React.createContext<CurrentTabContextType | undefined>(initialState);

const CurrentTabProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTab, setCurrentTab] = React.useState<NavigationPaths>("/discover/pexels-images");

  return (
    <CurrentTabContext.Provider value={{ currentTab, setCurrentTab }}>
      {children}
    </CurrentTabContext.Provider>
  );
};

export { CurrentTabContext, CurrentTabProvider };
