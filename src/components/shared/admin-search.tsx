"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Buildings,
  ChatCircleDots,
  FileText,
  FolderOpen,
  MagnifyingGlass,
  Receipt,
  SquaresFour,
} from "@phosphor-icons/react/dist/ssr";
import { searchAdmin, type SearchResult } from "@/lib/actions/search";

const ICONS = {
  client: Buildings,
  project: SquaresFour,
  invoice: Receipt,
  contract: FileText,
  file: FolderOpen,
  card: SquaresFour,
  decision: ChatCircleDots,
} as const;

export function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // This component is mounted twice at once (desktop sidebar + mobile menu),
  // one of them always display:none — only the one actually visible should
  // respond, or Cmd+K would fight between two hidden/visible instances.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (inputRef.current && inputRef.current.offsetParent !== null) {
          e.preventDefault();
          inputRef.current.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const found = await searchAdmin(value);
        setResults(found);
      });
    }, 200);
  }

  function goTo(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition-colors focus-within:border-white/25">
        <MagnifyingGlass size={15} className="shrink-0 text-white/40" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search everything…"
          className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
        <kbd className="hidden shrink-0 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/40 sm:block">
          ⌘K
        </kbd>
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg">
          {isPending && !results.length ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">Searching…</p>
          ) : !results.length ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">No matches.</p>
          ) : (
            results.map((r) => {
              const ItemIcon = ICONS[r.type];
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  type="button"
                  onClick={() => goTo(r.href)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <ItemIcon size={15} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-primary">{r.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{r.sublabel}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
