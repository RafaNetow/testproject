"use client";

import NextLink from "next/link";
import Box, { type BoxProps } from "@mui/material/Box";

/** A Box rendered as a Next Link — usable from server components, which can't pass `component={Link}`. */
export function LinkBox({ href, ...props }: Omit<BoxProps<"a">, "component" | "href"> & { href: string }) {
  return <Box component={NextLink} href={href} {...props} />;
}
