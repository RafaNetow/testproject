"use client";

import NextLink from "next/link";
import Chip, { type ChipProps } from "@mui/material/Chip";

/** A clickable Chip rendered as a Next Link — usable from server components. */
export function LinkChip({ href, ...props }: Omit<ChipProps<typeof NextLink>, "component" | "clickable"> & { href: string }) {
  return <Chip component={NextLink} href={href} clickable {...props} />;
}
