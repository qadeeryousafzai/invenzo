import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "brand-gradient text-white shadow-sm hover:brightness-95",
      secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      outline: "border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50",
      ghost: "text-slate-700 hover:bg-slate-100",
      destructive: "bg-red-700 text-white hover:bg-red-800",
    },
    size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-xl px-5", icon: "size-9" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
