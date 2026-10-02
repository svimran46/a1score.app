import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

/**
 * FotMob-style Card component:
 * bg-card, radius --card-radius (20px), padding --card-padding (20px), no border, no shadow in dark mode.
 */
export function Card({
  as: Component = "div",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Component
      className={`bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] text-[var(--text-primary)] transition-colors ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
