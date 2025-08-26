import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
      if (props.onChange) {
        props.onChange(e)
      }
    }

    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "peer h-6 w-11 appearance-none rounded-full bg-gray-200 transition-colors checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          className
        )}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
