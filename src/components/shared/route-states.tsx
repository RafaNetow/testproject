"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Replay from "@mui/icons-material/Replay";

/** Shared body for the portal's and admin's `error.tsx` boundaries. */
export function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Stack spacing={2} sx={{ minHeight: "50vh", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
      <Typography variant="overline" sx={{ color: "error.main", lineHeight: 1.5 }}>
        Error
      </Typography>
      <Typography variant="h1" sx={{ fontSize: 20 }}>
        Something went wrong.
      </Typography>
      <Typography sx={{ maxWidth: 380, fontSize: 15, lineHeight: 1.6, color: "text.muted" }}>
        {error.message || "The action couldn't be completed. Try again."}
      </Typography>
      <Button variant="contained" startIcon={<Replay />} onClick={retry} sx={{ mt: 1 }}>
        Try again
      </Button>
    </Stack>
  );
}

/** Shared skeleton for the portal's and admin's `loading.tsx`. */
export function RouteLoading() {
  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Skeleton variant="rounded" width={96} height={12} sx={{ borderRadius: 999 }} />
        <Skeleton variant="rounded" width={224} height={28} sx={{ borderRadius: 999 }} />
      </Stack>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={128} sx={{ borderRadius: 4 }} />
        ))}
      </Box>
    </Stack>
  );
}
