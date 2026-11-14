import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface/50 backdrop-blur-sm shadow-sm",
        glow && "shadow-[0_0_15px_rgba(37,99,235,0.1)] border-accent/20",
        className
      )}
      {...props}
    />
  )
}
