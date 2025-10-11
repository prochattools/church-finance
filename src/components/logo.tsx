import Image from "next/image";

import prochatLogoColor from "@/assets/images/prochat-logo.png";
import prochatLogoWhite from "@/assets/images/prochat-logo-white.png";
import { cn } from "@/helpers/utils";

interface LogoProps {
  isLarge?: boolean;
  className?: string;
  priority?: boolean;
}

const BASE_WIDTH = {
  small: 140,
  large: 220,
} as const;

const LOGO_HEIGHT_RATIO = 129 / 403;

const Logo = ({ isLarge = false, className, priority = false }: LogoProps) => {
  const width = isLarge ? BASE_WIDTH.large : BASE_WIDTH.small;
  const height = Math.round(width * LOGO_HEIGHT_RATIO);

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        isLarge ? "min-h-[48px]" : "min-h-[36px]",
        className
      )}
    >
      <Image
        src={prochatLogoColor}
        width={width}
        height={height}
        alt="ProChat logo"
        priority={priority}
        className="block dark:hidden"
      />
      <Image
        src={prochatLogoWhite}
        width={width}
        height={height}
        alt="ProChat logo"
        priority={priority}
        className="hidden dark:block"
      />
    </div>
  );
};

export default Logo;
