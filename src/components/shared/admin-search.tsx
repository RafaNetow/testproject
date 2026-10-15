"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import { searchAdmin, type SearchResult } from "@/lib/actions/search";
import { Search as SearchIcon, BusinessOutlined, ViewKanbanOutlined, ReceiptLongOutlined, DescriptionOutlined, FolderOpenOutlined, ForumOutlined } from "@/components/icons";

const ICONS = {
  client: BusinessOutlined,
  project: ViewKanbanOutlined,
  invoice: ReceiptLongOutlined,
  contract: DescriptionOutlined,
  file: FolderOpenOutlined,
  card: ViewKanbanOutlined,
  decision: ForumOutlined,
} as const;

export function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // This component is mounted twice at once (desktop sidebar + mobile menu),
  // one of them always hidden — only the one actually visible should respond,
  // or Cmd+K would fight between the two instances.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const input = containerRef.current?.querySelector("input");
        if (input && input.offsetParent !== null) {
          e.preventDefault();
          input.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchAdmin(value));
      });
    }, 200);
  }

  return (
    <Autocomplete<SearchResult, false, false, false>
      ref={containerRef}
      options={results}
      value={null}
      inputValue={query}
      open={query.trim().length >= 2 ? undefined : false}
      filterOptions={(x) => x}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.type === b.type && a.id === b.id}
      loading={isPending}
      loadingText="Searching…"
      noOptionsText="No matches."
      onInputChange={(_, value, reason) => {
        if (reason === "input") handleChange(value);
      }}
      onChange={(_, value) => {
        if (!value) return;
        setQuery("");
        setResults([]);
        router.push(value.href);
      }}
      slotProps={{ paper: { variant: "outlined", sx: { mt: 0.75, borderRadius: 3, boxShadow: 6 } } }}
      renderOption={(props, r) => {
        const { key, ...rest } = props;
        const ItemIcon = ICONS[r.type];
        return (
          <Box component="li" key={`${r.type}-${r.id}-${String(key)}`} {...rest} sx={{ gap: 1.25, fontSize: 14 }}>
            <ItemIcon sx={{ fontSize: 16, color: "text.muted", flexShrink: 0 }} />
            <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "text.primary" }}>
              {r.label}
            </Box>
            <Box component="span" sx={{ flexShrink: 0, fontSize: 12, color: "text.muted" }}>
              {r.sublabel}
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <Box
          ref={params.slotProps.input.ref}
          onMouseDown={params.slotProps.input.onMouseDown}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderRadius: 2,
            border: "1px solid transparent",
            bgcolor: "var(--color-muted)",
            px: 1.5,
            py: 0.75,
            transition: "border-color 150ms, background-color 150ms",
            "&:focus-within": { borderColor: "var(--color-primary)", bgcolor: "background.paper" },
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: "text.muted", flexShrink: 0 }} />
          <InputBase
            inputProps={params.slotProps.htmlInput}
            placeholder="Search everything…"
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: 14,
              color: "text.primary",
              "& input::placeholder": { color: "var(--color-muted-foreground)", opacity: 1 },
            }}
          />
          <Box
            component="kbd"
            sx={{
              display: { xs: "none", sm: "block" },
              flexShrink: 0,
              borderRadius: 0.5,
              bgcolor: "background.paper",
              boxShadow: "var(--shadow-card)",
              px: 0.75,
              py: 0.25,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              color: "text.secondary",
            }}
          >
            ⌘K
          </Box>
        </Box>
      )}
    />
  );
}
