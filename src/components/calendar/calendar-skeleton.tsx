import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// A fixed pattern (not random) so the server and the browser draw the same thing.
const BAR_WIDTHS = ["86%", "64%", "92%", "48%", "72%"];
const bars = (i: number) => (i * 37 + 11) % 3;

const ghostBar = (width: string, key: number) => (
  <Skeleton key={key} variant="rounded" animation="wave" width={width} height={20} sx={{ borderRadius: "6px" }} />
);

/**
 * What the calendar looks like while its first events load, as on Minimal:
 * the grid of the current view in grey with shimmering "ghost" events. Same
 * borders and row heights as the real calendar, so nothing jumps when it swaps.
 */
export function CalendarSkeleton({ view }: { view: string }) {
  if (view === "listWeek") {
    return (
      <Box aria-hidden sx={{ px: { xs: 0, sm: 1 } }}>
        {[0, 1].map((day) => (
          <Box key={day}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: "var(--fill-track)" }}>
              <Skeleton animation="wave" width={120} height={18} />
            </Box>
            {[0, 1, 2].map((row) => (
              <Box key={row} sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.5, borderBottom: "1px solid var(--color-border)" }}>
                <Skeleton animation="wave" width={70} height={16} />
                <Skeleton variant="circular" animation="wave" width={10} height={10} />
                <Skeleton animation="wave" width={BAR_WIDTHS[(day * 3 + row) % BAR_WIDTHS.length]} height={16} sx={{ maxWidth: 360 }} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  if (view.startsWith("timeGrid")) {
    const cols = view === "timeGridDay" ? 1 : 7;
    return (
      <Box aria-hidden sx={{ px: { xs: 0, sm: 1 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: `52px repeat(${cols}, 1fr)`, borderTop: "1px solid var(--color-border)" }}>
          {Array.from({ length: 10 }, (_, row) => (
            <Box key={row} sx={{ display: "contents" }}>
              <Box sx={{ height: 44, borderBottom: "1px solid var(--color-border)", pr: 1, pt: 0.5, display: "flex", justifyContent: "flex-end" }}>
                <Skeleton animation="wave" width={30} height={12} />
              </Box>
              {Array.from({ length: cols }, (_, c) => (
                <Box key={c} sx={{ position: "relative", height: 44, borderBottom: "1px solid var(--color-border)", borderLeft: "1px solid var(--color-border)" }}>
                  {(row * cols + c) % 9 === 3 && <Skeleton variant="rounded" animation="wave" sx={{ position: "absolute", inset: "3px 4px", height: 82, zIndex: 1 }} />}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box aria-hidden sx={{ px: { xs: 0, sm: 1 } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--color-border)" }}>
        {DAYS.map((d) => (
          <Box key={d} sx={{ py: 1.25, display: "grid", placeItems: "center" }}>
            <Skeleton animation="wave" width={28} height={16} />
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {Array.from({ length: 42 }, (_, i) => (
          <Box
            key={i}
            sx={{
              minHeight: 120,
              p: 0.75,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              borderBottom: "1px solid var(--color-border)",
              borderLeft: i % 7 ? "1px solid var(--color-border)" : 0,
            }}
          >
            <Skeleton animation="wave" width={18} height={16} sx={{ alignSelf: "flex-end", mb: 0.5 }} />
            {Array.from({ length: bars(i) }, (_, b) => ghostBar(BAR_WIDTHS[(i + b) % BAR_WIDTHS.length], b))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
