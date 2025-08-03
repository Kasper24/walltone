import * as React from "react";
import { Tab } from "./types.js";

interface CurrentTabContextType {
  currentTab: Tab;
  setCurrentTab: (currentTab: Tab) => void;
}

const initialState: CurrentTabContextType = {
  currentTab: "explore",
  setCurrentTab: () => null,
};

const CurrentTabContext = React.createContext<CurrentTabContextType | undefined>(initialState);

const useCurrentTab = () => {
  const context = React.useContext(CurrentTabContext);
  if (!context) throw new Error("useCurrentTab must be used within an CurrentTabProvider");
  return context;
};

export { useCurrentTab };
