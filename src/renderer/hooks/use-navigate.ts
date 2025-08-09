import { useNavigate as useReactRouterNavigate } from "react-router-dom";
import { routes } from "@renderer/routes/index.js";

type NavigationPaths = (typeof routes)[keyof typeof routes]["path"];

const useNavigate = () => {
  const navigate = useReactRouterNavigate();
  return (path: NavigationPaths) => navigate(path);
};

export { useNavigate };
