/** @format */

"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(
  ({ className, indeterminate = false, ...props }, ref) => {
    const innerRef = React.useRef(null);

    React.useImperativeHandle(ref, () => innerRef.current);

    return (
      <CheckboxPrimitive.Root
        ref={innerRef}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
          className
        )}
        {...props}
        data-state={
          indeterminate
            ? "indeterminate"
            : props.checked
            ? "checked"
            : "unchecked"
        }>
        <CheckboxPrimitive.Indicator
          className={cn("flex items-center justify-center text-current")}>
          {indeterminate ? (
            <Minus className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
