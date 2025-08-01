import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@renderer/components/ui/button.js";

interface Props extends React.ComponentProps<typeof Button> {
  isLoading: boolean;
  children: React.ReactNode;
}

const LoadingButton = ({ children, isLoading, ...props }: Props) => {
  return (
    <Button {...props}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
};

export default LoadingButton;
