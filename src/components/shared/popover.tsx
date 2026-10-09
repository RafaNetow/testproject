"use client";

import { useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import MuiPopover from "@mui/material/Popover";

/** A floating panel anchored to its trigger; closes on an outside click or Escape. */
export function Popover({
  trigger,
  children,
  align = "left",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);

  return (
    <>
      <Box component="span" ref={anchorRef} sx={{ display: "inline-flex" }}>
        {trigger({ open, toggle: () => setAnchorEl((a) => (a ? null : anchorRef.current)) })}
      </Box>
      <MuiPopover
        open={open}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: align }}
        transformOrigin={{ vertical: "top", horizontal: align }}
        slotProps={{ paper: { variant: "outlined", sx: { mt: 1, borderRadius: 3, boxShadow: 6 } } }}
      >
        {children(close)}
      </MuiPopover>
    </>
  );
}
