"use client";

import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { CalendarMonthOutlined, ExpandMore, FilterListOutlined, Search, StarFilled, StarOutline } from "@/components/icons";
import { FILE_GROUPS, hasFilters, NO_FILTERS, type FileFilters as Filters, type FileGroup } from "@/lib/file-manager";

const DAY = "YYYY-MM-DD";
const pretty = (d: string) => dayjs(d).format("D MMM YYYY");

const filterButtonSx = {
  height: 40,
  px: 1.5,
  color: "text.primary",
  borderColor: "var(--border-control)",
  fontWeight: 600,
  whiteSpace: "nowrap",
} as const;

/**
 * The File Manager toolbar's filters, as on Minimal: search by name, a Type
 * popover (checkboxes), a date range popover, Favourites and — Alchemica's
 * own — the technique. Below, "N results" with a chip per active filter and
 * Clear.
 */
export function FileFilters({
  value,
  onChange,
  techniques,
}: {
  value: Filters;
  onChange: (next: Filters) => void;
  techniques: string[];
}) {
  const [typeAnchor, setTypeAnchor] = useState<HTMLElement | null>(null);
  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null);
  const [techAnchor, setTechAnchor] = useState<HTMLElement | null>(null);
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const toggleGroup = (g: FileGroup) => set({ groups: value.groups.includes(g) ? value.groups.filter((x) => x !== g) : [...value.groups, g] });
  const dateLabel = value.from || value.to ? `${value.from ? pretty(value.from) : "…"} – ${value.to ? pretty(value.to) : "…"}` : "Date";

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, flex: 1, minWidth: 0 }}>
      <TextField
        value={value.search}
        onChange={(e) => set({ search: e.target.value })}
        placeholder="Search…"
        size="small"
        sx={{ width: { xs: "100%", sm: 240 }, "& .MuiInputBase-root": { height: 40 } }}
        slotProps={{
          htmlInput: { "aria-label": "Search files and folders" },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: "text.muted" }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Badge color="primary" badgeContent={value.groups.length} invisible={!value.groups.length}>
        <Button variant="outlined" color="inherit" onClick={(e) => setTypeAnchor(e.currentTarget)} endIcon={<ExpandMore />} startIcon={<FilterListOutlined />} sx={filterButtonSx} aria-haspopup="true">
          Type
        </Button>
      </Badge>
      <Popover
        open={Boolean(typeAnchor)}
        anchorEl={typeAnchor}
        onClose={() => setTypeAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220 } } }}
      >
        <MenuList dense aria-label="File types">
          {FILE_GROUPS.map((g) => (
            <MenuItem key={g.key} onClick={() => toggleGroup(g.key)} role="menuitemcheckbox" aria-checked={value.groups.includes(g.key)}>
              <Checkbox size="small" checked={value.groups.includes(g.key)} tabIndex={-1} sx={{ p: 0.5, mr: 1 }} />
              <ListItemText primary={g.name} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
            </MenuItem>
          ))}
        </MenuList>
      </Popover>

      <Button
        variant="outlined"
        color="inherit"
        onClick={(e) => setDateAnchor(e.currentTarget)}
        startIcon={<CalendarMonthOutlined />}
        endIcon={<ExpandMore />}
        sx={{ ...filterButtonSx, ...(value.from || value.to ? { borderColor: "primary.main" } : {}) }}
        aria-haspopup="dialog"
      >
        {dateLabel}
      </Button>
      <Popover
        open={Boolean(dateAnchor)}
        anchorEl={dateAnchor}
        onClose={() => setDateAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 0.5, p: 2, width: 300 }, role: "dialog", "aria-label": "Date range" } }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <Stack spacing={2}>
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Added between</Typography>
            <DatePicker label="From" value={value.from ? dayjs(value.from) : null} onChange={(d) => set({ from: d?.isValid() ? d.format(DAY) : null })} maxDate={value.to ? dayjs(value.to) : undefined} slotProps={{ textField: { size: "small" }, field: { clearable: true } }} />
            <DatePicker label="To" value={value.to ? dayjs(value.to) : null} onChange={(d) => set({ to: d?.isValid() ? d.format(DAY) : null })} minDate={value.from ? dayjs(value.from) : undefined} slotProps={{ textField: { size: "small" }, field: { clearable: true } }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button color="secondary" onClick={() => set({ from: null, to: null })} disabled={!value.from && !value.to}>
                Reset
              </Button>
              <Button variant="contained" onClick={() => setDateAnchor(null)}>
                Done
              </Button>
            </Box>
          </Stack>
        </LocalizationProvider>
      </Popover>

      {techniques.length > 0 && (
        <>
          <Button
            variant="outlined"
            color="inherit"
            onClick={(e) => setTechAnchor(e.currentTarget)}
            endIcon={<ExpandMore />}
            sx={{ ...filterButtonSx, ...(value.technique ? { borderColor: "primary.main" } : {}) }}
            aria-haspopup="menu"
          >
            {value.technique ?? "Technique"}
          </Button>
          <Popover open={Boolean(techAnchor)} anchorEl={techAnchor} onClose={() => setTechAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} slotProps={{ paper: { sx: { mt: 0.5, minWidth: 180 } } }}>
            <MenuList dense aria-label="Technique">
              <MenuItem selected={!value.technique} onClick={() => (set({ technique: null }), setTechAnchor(null))}>
                All techniques
              </MenuItem>
              {techniques.map((t) => (
                <MenuItem key={t} selected={value.technique === t} onClick={() => (set({ technique: t }), setTechAnchor(null))}>
                  {t}
                </MenuItem>
              ))}
            </MenuList>
          </Popover>
        </>
      )}

      <Button
        variant={value.favouritesOnly ? "contained" : "outlined"}
        color={value.favouritesOnly ? "warning" : "inherit"}
        onClick={() => set({ favouritesOnly: !value.favouritesOnly })}
        startIcon={value.favouritesOnly ? <StarFilled /> : <StarOutline />}
        aria-pressed={value.favouritesOnly}
        sx={{ ...filterButtonSx, ...(value.favouritesOnly ? { color: "#fff", borderColor: "transparent" } : {}) }}
      >
        Favourites
      </Button>
    </Box>
  );
}

/** "N results found" and a removable chip per active filter, with Clear (Minimal's filter results bar). */
export function FilterResults({ value, onChange, total }: { value: Filters; onChange: (next: Filters) => void; total: number }) {
  if (!hasFilters(value)) return null;
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const chipSx = { fontWeight: 600 } as const;
  return (
    <Box role="status" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
      <Typography sx={{ fontSize: 14, mr: 0.5 }}>
        <Box component="strong">{total}</Box>{" "}
        <Box component="span" sx={{ color: "text.secondary" }}>
          {total === 1 ? "result found" : "results found"}
        </Box>
      </Typography>
      {value.search.trim() && <Chip size="small" sx={chipSx} label={`Name: ${value.search.trim()}`} onDelete={() => set({ search: "" })} />}
      {value.groups.map((g) => (
        <Chip key={g} size="small" sx={chipSx} label={`Type: ${FILE_GROUPS.find((x) => x.key === g)?.name}`} onDelete={() => set({ groups: value.groups.filter((x) => x !== g) })} />
      ))}
      {(value.from || value.to) && (
        <Chip size="small" sx={chipSx} label={`Date: ${value.from ? pretty(value.from) : "…"} – ${value.to ? pretty(value.to) : "…"}`} onDelete={() => set({ from: null, to: null })} />
      )}
      {value.technique && <Chip size="small" sx={chipSx} label={`Technique: ${value.technique}`} onDelete={() => set({ technique: null })} />}
      {value.favouritesOnly && <Chip size="small" sx={chipSx} label="Favourites" onDelete={() => set({ favouritesOnly: false })} />}
      <Button size="small" color="error" onClick={() => onChange(NO_FILTERS)} sx={{ fontWeight: 700 }}>
        Clear
      </Button>
    </Box>
  );
}
