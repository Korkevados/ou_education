/** @format */

import * as React from "react";
import { DashIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPSlot = React.forwardRef(
  ({ char, className, onChange, ...props }, ref) => (
    <div className={cn("relative h-14 w-10", className)}>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={1}
        className="absolute inset-0 w-full h-full text-center text-2xl font-semibold rounded-md border focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        value={char}
        onChange={onChange}
        {...props}
      />
      {!char && (
        <DashIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      )}
    </div>
  )
);
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = ({ className, ...props }) => (
  <div role="separator" className={cn("w-2", className)} {...props} />
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPSlot, InputOTPSeparator };
