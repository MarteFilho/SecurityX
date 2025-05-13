import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './select';

interface SelectNoScrollProps extends ComponentPropsWithoutRef<typeof Select> {
  options: { value: string; label: string }[]
  placeholder?: string
}

export const SelectNoScroll = forwardRef<
  ElementRef<typeof Select>,
  SelectNoScrollProps
>(({ options, placeholder, ...props }, ref) => {
  const currentPosition = window.scrollY

  return (
    <Select
      {...props}
      ref={ref}
      onOpenChange={(open) => {
        if (!open) {
          requestAnimationFrame(() => {
            window.scrollTo(0, currentPosition)
          })
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})

SelectNoScroll.displayName = 'SelectNoScroll' 