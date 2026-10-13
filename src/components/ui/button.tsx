import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border text-sm font-semibold whitespace-nowrap transition-[transform,background-color,border-color,box-shadow,color] outline-none select-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--pop)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[var(--ink)] bg-[var(--ink)] text-white shadow-[0_3px_0_0_var(--pop)] hover:bg-[color-mix(in_oklab,var(--ink)_88%,white)] hover:shadow-[0_2px_0_0_var(--pop)] active:shadow-none",
        outline:
          "border-[var(--ink)] bg-white text-[var(--ink)] shadow-[0_3px_0_0_var(--line)] hover:bg-[var(--wash)] hover:shadow-[0_2px_0_0_var(--line)] active:shadow-none",
        secondary:
          "border-l-[3px] border-[var(--pop)] border-y-[var(--line)] border-r-[var(--line)] bg-[var(--wash)] text-[var(--ink)] hover:bg-white",
        ghost:
          "border-transparent bg-transparent text-[var(--mute)] shadow-none hover:bg-[var(--wash)] hover:text-[var(--ink)]",
        destructive:
          "border-[#7f1d1d] bg-[#7f1d1d] text-white shadow-[0_3px_0_0_#450a0a] hover:bg-[#991b1b] active:shadow-none",
        link: "border-transparent bg-transparent text-[var(--pop)] underline-offset-4 shadow-none hover:underline",
      },
      size: {
        default: "min-h-11 px-4 py-2.5",
        xs: "min-h-8 gap-1 px-2.5 py-1 text-xs",
        sm: "min-h-9 gap-1.5 px-3 py-2 text-[0.8rem]",
        lg: "min-h-12 gap-2 px-5 py-3 text-base",
        icon: "size-11",
        "icon-xs": "size-8",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant ?? "default"}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
