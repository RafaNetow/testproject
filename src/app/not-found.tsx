import Link from "next/link";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function NotFound() {
  return (
    <Stack spacing={2} sx={{ minHeight: "100dvh", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
      <Typography variant="overline" sx={{ color: "primary.main", lineHeight: 1.5 }}>
        404
      </Typography>
      <Typography variant="h1" sx={{ fontSize: 24 }}>
        This page doesn&apos;t exist.
      </Typography>
      <Typography sx={{ maxWidth: 380, fontSize: 15, lineHeight: 1.6, color: "text.muted" }}>
        The link might be old, or the address was typed wrong.
      </Typography>
      <Button href="/" variant="contained" sx={{ mt: 1 }}>
        Back to the homepage
      </Button>
    </Stack>
  );
}
