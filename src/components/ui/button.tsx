import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Apple-style pill buttons: filled blue for the main action, a light grey fill for secondary ones.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-normal transition-[background-color,color,box-shadow,transform] duration-200 ease-out select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring active:scale-[0.98] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-fill text-foreground hover:bg-fill-hover",
        ghost: "text-foreground hover:bg-fill",
        outline: "text-link shadow-[inset_0_0_0_1px_var(--link)] hover:bg-link hover:text-white",
        danger: "bg-danger-fill text-white hover:brightness-110",
        link: "text-link hover:underline underline-offset-4 active:scale-100",
      },
      size: {
        // On touch screens the small size grows to a 44px tap target.
        sm: "h-8 px-3.5 text-[13px] max-sm:h-10 max-sm:px-4 [&_svg]:size-3.5",
        md: "h-10 px-5 text-[15px] [&_svg]:size-4",
        lg: "h-12 px-6 text-[17px] [&_svg]:size-[18px]",
        icon: "h-9 w-9 [&_svg]:size-4",
        "icon-sm": "h-8 w-8 [&_svg]:size-[17px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";

export { buttonVariants };
