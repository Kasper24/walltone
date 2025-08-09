import { cn } from "@renderer/lib/cn.js";
import React from "react";
import { Blurhash } from "react-blurhash";

type ContentElement = React.ReactElement<
  React.ImgHTMLAttributes<HTMLImageElement> | React.VideoHTMLAttributes<HTMLVideoElement>,
  "img" | "video"
>;

const BlurhashPreview = ({
  blurHash,
  className,
  Content,
}: {
  blurHash?: string;
  className: string;
  Content: ContentElement;
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setSize({ width: clientWidth, height: clientHeight + 10 });
    }
  }, []);

  const contentWithOnLoad = React.cloneElement(Content, {
    onLoad: () => {
      setIsLoading(false);
    },
  });

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      {blurHash && isLoading && size.width > 0 && size.height > 0 && (
        <Blurhash hash={blurHash} width={size.width} height={size.height} />
      )}
      {contentWithOnLoad}
    </div>
  );
};

export { BlurhashPreview };
