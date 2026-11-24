import { Box, Code2, Layers, LayoutGrid, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BentoDisciplineItem {
  name: string;
  text: string;
  imageSrc?: string;
  imageAlt?: string;
  iconKey?: "design" | "dev" | "app" | "brand";
}

export interface FeatureProps {
  badge?: string;
  title?: string;
  description?: string;
  items?: BentoDisciplineItem[];
  ctaHref?: string;
  ctaLabel?: string;
}

const ICONS = {
  design: LayoutGrid,
  dev: Code2,
  app: Layers,
  brand: Box,
} as const;

const DEFAULT_ITEMS: BentoDisciplineItem[] = [
  {
    name: "Web design",
    text: "Websites and interfaces with a clear structure and a distinct look, tested with real users.",
    iconKey: "design",
  },
  {
    name: "Creative web development",
    text: "Motion, WebGL and scroll-driven storytelling, built fast and accessible.",
    iconKey: "dev",
  },
  {
    name: "Web app",
    text: "Dashboards, portals and SaaS products built to last, with tests, docs and a clean handover.",
    iconKey: "app",
  },
  {
    name: "Brand visualization",
    text: "Brand identities, 3D visuals and motion that make your product recognizable everywhere.",
    iconKey: "brand",
  },
];

function Feature({
  badge = "What we do (4)",
  title = "Design, code, and motion under one roof.",
  description = "Four core disciplines engineered together from first sketch to production launch.",
  items = DEFAULT_ITEMS,
  ctaHref = "/projects/",
  ctaLabel = "Explore selected work",
}: FeatureProps) {
  return (
    <div className="w-full py-6 lg:py-10">
      <div className="flex flex-col gap-10 lg:gap-12">
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          data-reveal
        >
          <div className="flex gap-4 flex-col items-start">
            <div>
              <Badge
                variant="outline"
                className="border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] px-3 py-1 font-medium"
              >
                {badge}
              </Badge>
            </div>
            <div className="flex gap-3 flex-col">
              <h2
                id="e-wd-t"
                className="text-[var(--text-3xl)] md:text-[var(--text-4xl)] leading-[1.04] tracking-[-0.04em] max-w-2xl font-medium text-left text-foreground text-balance"
              >
                {title}
              </h2>
              <p className="text-[var(--text-base)] md:text-[var(--text-lg)] max-w-xl leading-relaxed tracking-[-0.01em] text-muted-foreground text-left">
                {description}
              </p>
            </div>
          </div>

          {ctaHref && ctaLabel && (
            <a
              href={ctaHref}
              className="ulink inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground shrink-0 whitespace-nowrap self-start md:self-end"
            >
              <span>{ctaLabel}</span>
              <ArrowUpRight className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
            </a>
          )}
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          data-stagger
        >
          {items.map((item, idx) => {
            const isWide = idx === 0 || idx === 3;
            const iconOrder: Array<keyof typeof ICONS> = [
              "design",
              "dev",
              "app",
              "brand",
            ];
            const Icon = ICONS[item.iconKey ?? iconOrder[idx % iconOrder.length]];
            const indexLabel = String(idx + 1).padStart(2, "0");

            return (
              <article
                key={item.name}
                className={cn(
                  "relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]",
                  "p-6 sm:p-8 flex flex-col justify-between",
                  isWide
                    ? "lg:col-span-2 min-h-[340px] lg:min-h-[380px]"
                    : "min-h-[340px] sm:aspect-square lg:aspect-auto lg:min-h-[380px]",
                )}
              >
                {/* Full-bleed background image filling the entire card */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                >
                  {item.imageSrc && (
                    <img
                      src={item.imageSrc}
                      alt={item.imageAlt ?? ""}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="e-wd-bg-img absolute inset-0 h-full! w-full! object-cover"
                    />
                  )}
                </div>

                <div className="relative z-10 flex items-center justify-between gap-4">
                  <Icon
                    className="w-7 h-7 stroke-[1.5] text-[var(--orange)]"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium tracking-[0.06em] tabular-nums text-foreground/80">
                    {indexLabel}
                  </span>
                </div>

                <div className="relative z-10 flex flex-col gap-2">
                  <h3 className="text-[var(--text-xl)] leading-[1.12] tracking-[-0.03em] font-semibold text-foreground">
                    {item.name}
                  </h3>
                  <p className="text-foreground/75 max-w-[38ch] text-[var(--text-base)] leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { Feature };
