import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BuildOutlined } from "@/components/icons";

export function ComingSoon({ title }: { title: string }) {
  return (
    <Stack spacing={4}>
      <div>
        <Typography variant="overline" sx={{ color: "primary.main", lineHeight: 1.5 }}>
          {title}
        </Typography>
        <Typography variant="h1" sx={{ mt: 1, fontSize: 24 }}>
          {title}
        </Typography>
      </div>
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          minHeight: "40vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          borderStyle: "dashed",
          px: 3,
          py: 10,
          textAlign: "center",
        }}
      >
        <BuildOutlined sx={{ fontSize: 28, color: "primary.main" }} />
        <div>
          <Typography variant="h6" component="p" sx={{ fontSize: 18 }}>
            Not built yet
          </Typography>
          <Typography sx={{ mt: 0.75, maxWidth: 380, fontSize: 15, lineHeight: 1.6, color: "text.muted" }}>
            This part of the {title.toLowerCase()} area is still being built. It&apos;ll show up here once
            it&apos;s ready.
          </Typography>
        </div>
      </Paper>
    </Stack>
  );
}
