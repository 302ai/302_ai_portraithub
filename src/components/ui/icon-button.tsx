import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "transparent" | "white";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
};

const variantClasses = {
  default: "bg-black/50 backdrop-blur-sm hover:bg-black/70",
  transparent: "hover:bg-white/10",
  white: "bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white",
};

export const IconButton = ({
  children,
  className = "",
  variant = "default",
  size = "md",
  ...props
}: IconButtonProps) => {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <button
        className={` ${sizeClasses[size]} ${variantClasses[variant]} rounded-full transition-colors ${className} `}
        type="button"
        {...props}
      >
        {children}
      </button>
    </motion.div>
  );
};
