"use client";

import { useEffect } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { GearLoader } from "@/components/shared/gear-loader";

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
      <Button variant="contained" onClick={retry} sx={{ mt: 1 }}>
        Try again
      </Button>
    </Stack>
  );
}

/** Shared loading screen for the portal's and admin's `loading.tsx`: the spinning gears. */
export function RouteLoading() {
  return <GearLoader />;
}
