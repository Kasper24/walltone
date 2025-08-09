import * as React from "react";
import { CurrentTabContext } from "./provider.js";

const useCurrentTab = () => {
  const context = React.useContext(CurrentTabContext);
  if (!context) throw new Error("useCurrentTab must be used within an CurrentTabProvider");
  return context;
};

export { useCurrentTab };
