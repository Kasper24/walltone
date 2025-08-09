import { useNavigate as useReactRouterNavigate } from "react-router-dom";
import { routes } from "@renderer/routes/index.js";

type NavigationPaths = (typeof routes)[keyof typeof routes]["path"];

const useNavigate = () => {
  const navigate = useReactRoutersetCurrentTab();
  return (path: NavigationPaths) => setCurrentTab(path);
};

export { useNavigate };
