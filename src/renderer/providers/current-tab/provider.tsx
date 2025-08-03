import * as React from "react";
import { CurrentTabContext } from "./hook.js";
import { type Tab } from "./types.js";

const CurrentTabProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTab, setCurrentTab] = React.useState<Tab>("explore");

  return (
    <CurrentTabContext.Provider value={{ currentTab, setCurrentTab }}>
      {children}
    </CurrentTabContext.Provider>
  );
};

export { CurrentTabProvider };
