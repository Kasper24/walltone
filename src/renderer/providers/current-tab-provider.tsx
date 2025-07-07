import * as React from "react";

type Tab = "explore" | "wallpapers" | "settings";

interface CurrentTabContextType {
  currentTab: Tab;
  setCurrentTab: (currentTab: Tab) => void;
}

const initialState: CurrentTabContextType = {
  currentTab: "explore",
  setCurrentTab: () => null,
};

const CurrentTabContext = React.createContext<CurrentTabContextType | undefined>(initialState);

const CurrentTabProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTab, setCurrentTab] = React.useState<Tab>("explore");

  return (
    <CurrentTabContext.Provider value={{ currentTab, setCurrentTab }}>
      {children}
    </CurrentTabContext.Provider>
  );
};

const useCurrentTab = () => {
  const context = React.useContext(CurrentTabContext);
  if (!context) throw new Error("useCurrentTab must be used within an CurrentTabProvider");
  return context;
};

export { CurrentTabProvider, useCurrentTab };
