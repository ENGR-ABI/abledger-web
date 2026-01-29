import * as React from "react"

import { cn } from "@/lib/utils"

import { ChevronRight } from "lucide-react"

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: {
    regular: string
    gradient: string
  }
  description?: string
  ctaText?: string
  ctaHref?: string
  bottomImage?: {
    light: string
    dark: string
  }
  gridOptions?: {
    angle?: number
    cellSize?: number
    opacity?: number
    lightLineColor?: string
    darkLineColor?: string
  }
}

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden [perspective:200px]",
        `opacity-[var(--opacity)]`,
      )}
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90% dark:from-black" />
    </div>
  )
}

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      title = "Enterprise Business Management",
      subtitle = {
        regular: "Run Your Business on a Single Source of ",
        gradient: "Truth",
      },
      description = "abLedger unifies inventory, customers, and sales into one seamless platform. Manage everything your business needs—with real-time insights and powerful automation.",
      ctaText = "Get Started Free",
      ctaHref = "/get-started",
      bottomImage,
      gridOptions,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("relative", className)} ref={ref} {...props}>
        {/* Blue gradient background matching logo */}
        <div className="absolute top-0 z-[0] h-screen w-screen bg-blue-950/10 dark:bg-blue-950/20 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(40,162,253,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(40,162,253,0.3),rgba(0,0,0,0))]" />

        <section className="overflow-hidden bg-white dark:bg-transparent relative max-w-full mx-auto z-1">
          <RetroGrid
            {...gridOptions}
            lightLineColor={gridOptions?.lightLineColor || "#4a5568"}
            darkLineColor={gridOptions?.darkLineColor || "#2d3748"}
          />

          <div className="relative mx-auto max-w-5xl px-6 py-28 lg:py-24 z-10">
            <div className="space-y-5 max-w-3xl leading-0 lg:leading-5 mx-auto text-center">
              <h1 className="text-sm text-gray-600 dark:text-gray-400 group font-geist mx-auto px-5 py-2 bg-gradient-to-tr from-zinc-300/20 via-gray-400/20 to-transparent dark:from-zinc-300/5 dark:via-gray-400/5 border-[2px] border-black/5 dark:border-white/5 rounded-3xl w-fit">
                {title}
                <ChevronRight className="inline w-4 h-4 ml-2 group-hover:translate-x-1 duration-300" />
              </h1>

              <h2 className="text-4xl tracking-tighter font-geist bg-clip-text text-transparent mx-auto md:text-6xl lg:text-7xl bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
                {subtitle.regular}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#093c93] to-[#28a2fd] dark:from-[#28a2fd] dark:to-[#4ab8fd]">
                  {subtitle.gradient}
                </span>
              </h2>

              <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 text-lg">
                {description}
              </p>

              <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0 pt-4">
                <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#093c93_0%,#28a2fd_50%,#093c93_100%)]" />
                  <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                    <a
                      href={ctaHref}
                      className="inline-flex rounded-full text-center group items-center w-full justify-center bg-gradient-to-tr from-zinc-300/20 via-[#28a2fd]/30 to-transparent dark:from-zinc-300/5 dark:via-[#28a2fd]/20 text-gray-900 dark:text-white border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/30 hover:via-[#28a2fd]/40 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-[#28a2fd]/30 transition-all sm:w-auto py-4 px-10"
                    >
                      {ctaText}
                      <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 duration-300" />
                    </a>
                  </div>
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 pt-4">
                <span>✓ 14-day free trial</span>
                <span className="mx-2">•</span>
                <span>✓ No credit card required</span>
              </div>
            </div>

          </div>

          {bottomImage && (
            <div className="mx-auto -mt-16 max-w-7xl [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]">
              <div className="[perspective:1200px] [mask-image:linear-gradient(to_right,black_50%,transparent_100%)] -mr-16 pl-16 lg:-mr-56 lg:pl-56">
                <div className="[transform:rotateX(20deg);]">
                  <div className="lg:h-[44rem] relative skew-x-[.36rad]">
                    <img
                      className="rounded-lg z-[2] relative border border-gray-200 dark:hidden w-full h-auto object-cover"
                      src={bottomImage.light}
                      alt="abLedger dashboard preview"
                      width={2880}
                      height={2074}
                    />
                    <img
                      className="rounded-lg z-[2] relative hidden border border-gray-800 dark:block w-full h-auto object-cover"
                      src={bottomImage.dark}
                      alt="abLedger dashboard preview"
                      width={2880}
                      height={2074}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    )
  },
)

HeroSection.displayName = "HeroSection"

export { HeroSection }

