"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Check, ExpandMore } from "@/components/icons";
import { categorical } from "@/lib/palette";
import { FILE_KINDS, LABEL_HINTS, TECHNIQUES, type FileLabel } from "@/lib/techniques";
import { setFileTechnique } from "@/lib/actions/files";

const subheaderSx = { lineHeight: "32px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.muted" } as const;

/**
 * Admin: the file's technique label is itself the control. Clicking the chip
 * opens a menu of techniques and document kinds, each with its plain-language
 * hint, instead of a native select in every row.
 */
export function TechniqueMenu({
  fileId,
  filename,
  technique,
  revalidatePaths,
}: {
  fileId: string;
  filename: string;
  technique: string | null;
  revalidatePaths: string[];
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [pending, startTransition] = useTransition();
  const tone = technique ? categorical(technique) : null;

  function choose(value: string) {
    setAnchor(null);
    if (value === (technique ?? "")) return;
    const form = new FormData();
    form.set("technique", value);
    startTransition(() => setFileTechnique(fileId, revalidatePaths, form));
  }

  const item = (label: FileLabel) => (
    <MenuItem key={label} selected={label === technique} onClick={() => choose(label)} sx={{ alignItems: "flex-start", py: 0.75, maxWidth: 320 }}>
      <ListItemIcon sx={{ mt: 0.25, minWidth: 28 }}>{label === technique && <Check sx={{ fontSize: 16 }} />}</ListItemIcon>
      <ListItemText
        primary={label}
        secondary={LABEL_HINTS[label]}
        slotProps={{
          primary: { sx: { fontSize: 14, fontWeight: 600 } },
          secondary: { sx: { fontSize: 12, whiteSpace: "normal", lineHeight: 1.4 } },
        }}
      />
    </MenuItem>
  );

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-label={`Technique for ${filename}: ${technique ?? "no label"}. Change`}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.25,
          height: 24,
          pl: 1,
          pr: 0.5,
          borderRadius: 0.75,
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: "nowrap",
          opacity: pending ? 0.5 : 1,
          ...(tone
            ? { bgcolor: tone.bg, color: tone.text }
            : { border: "1px dashed var(--border-control)", color: "text.secondary" }),
          "&:hover": { boxShadow: "inset 0 0 0 1px var(--border-control)" },
          "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
        }}
      >
        {technique ?? "Add label"}
        <ExpandMore aria-hidden sx={{ fontSize: 14 }} />
      </ButtonBase>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { maxHeight: 420 } }, list: { dense: true } }}
      >
        <ListSubheader sx={subheaderSx}>Techniques</ListSubheader>
        {TECHNIQUES.map(item)}
        <ListSubheader sx={subheaderSx}>Documents</ListSubheader>
        {FILE_KINDS.map(item)}
        <Box component="li" role="separator" sx={{ my: 0.5, borderTop: 1, borderColor: "divider", listStyle: "none" }} />
        <MenuItem onClick={() => choose("")} disabled={!technique} sx={{ fontSize: 14, color: "text.secondary" }}>
          <ListItemIcon sx={{ minWidth: 28 }} />
          No label
        </MenuItem>
      </Menu>
    </>
  );
}
