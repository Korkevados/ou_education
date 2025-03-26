/** @format */

import { toast } from "sonner";

export function useToast() {
  return {
    toast: ({ title, description, ...props }) => {
      toast(title, {
        description,
        ...props,
      });
    },
  };
}
