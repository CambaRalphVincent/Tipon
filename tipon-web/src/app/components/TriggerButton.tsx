import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./ui/button";
import { cn } from "./ui/utils";

// A forwardRef DOM button that mirrors the design-system Button styling.
// Use this (instead of <Button>) as the child of Radix `asChild` triggers
// (Popover/Dialog/Dropdown/AlertDialog), which pass a ref to their child —
// the project's <Button> is a plain function component and cannot receive one.
export const TriggerButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>
>(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});
TriggerButton.displayName = "TriggerButton";
