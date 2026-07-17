import { Wrench } from "@phosphor-icons/react/dist/ssr";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{title}</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">{title}</h1>
      </div>
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center">
        <Wrench size={28} className="text-accent" />
        <div>
          <p className="font-display text-lg font-medium text-primary">Not built yet</p>
          <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            This part of the {title.toLowerCase()} area is still being built. It&apos;ll show up
            here once it&apos;s ready.
          </p>
        </div>
      </div>
    </div>
  );
}
