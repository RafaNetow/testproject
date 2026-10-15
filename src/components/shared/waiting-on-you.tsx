import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import DrawOutlined from "@mui/icons-material/DrawOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import SummarizeOutlined from "@mui/icons-material/SummarizeOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import { STATUS_TONE, figureSx, type Tone } from "@/lib/palette";
import type { WaitingItem, WaitingKind } from "@/lib/waiting";

const KIND: Record<WaitingKind, { icon: SvgIconComponent; tone: Tone; verb: string; action: string }> = {
  review: { icon: SummarizeOutlined, tone: STATUS_TONE.warning, verb: "Review the deliverable", action: "Review" },
  sign: { icon: DrawOutlined, tone: STATUS_TONE.warning, verb: "Sign", action: "Sign" },
  upload: { icon: CloudUploadOutlined, tone: STATUS_TONE.primary, verb: "Send us", action: "Upload" },
  answer: { icon: HelpOutlineOutlined, tone: STATUS_TONE.info, verb: "We need your input on", action: "Answer" },
};

function dueLabel(due: string) {
  const date = new Date(`${due}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Everything the client has to do, in one list with one button each — the
 * first thing they see after the opening card.
 */
export function WaitingOnYou({
  items,
  showProject,
  today,
}: {
  items: WaitingItem[];
  showProject: boolean;
  /** YYYY-MM-DD, from the server, to flag overdue items without a hydration mismatch. */
  today: string;
}) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2, px: 3, pt: 3, pb: 1.5 }}>
        <Typography variant="h2" sx={{ fontSize: 18 }}>
          Waiting on you
        </Typography>
        {items.length > 0 && (
          <Typography sx={{ ...figureSx, fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </Typography>
        )}
      </Box>

      {items.length === 0 ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, pb: 3, pt: 1 }}>
          <TaskAltOutlined sx={{ color: STATUS_TONE.success.solid }} />
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Nothing is waiting on you — we&apos;ll let you know when something is.
          </Typography>
        </Box>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, pb: 1 }}>
          {items.map((item) => {
            const kind = KIND[item.kind];
            const Icon = kind.icon;
            return (
              <Box
                component="li"
                key={`${item.kind}-${item.id}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mx: 1,
                  px: 2,
                  py: 1.5,
                  borderRadius: 1.5,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: 1.5,
                    bgcolor: kind.tone.bg,
                    color: kind.tone.text,
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                    {kind.verb} <Box component="span" sx={{ color: "primary.main" }}>&ldquo;{item.title}&rdquo;</Box>
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontSize: 12, color: "text.secondary" }}>
                    {showProject && item.projectName}
                    {showProject && item.projectName && (item.due ? " · " : "")}
                    {item.due ? (
                      item.due < today ? (
                        <Box component="span" sx={{ color: STATUS_TONE.error.text, fontWeight: 700 }}>
                          Overdue · was due {dueLabel(item.due)}
                        </Box>
                      ) : (
                        `Due ${dueLabel(item.due)}`
                      )
                    ) : (
                      !(showProject && item.projectName) && "No due date"
                    )}
                  </Typography>
                </Box>
                <Button
                  href={item.href}
                  variant="outlined"
                  color="secondary"
                  size="small"
                  {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  sx={{ flexShrink: 0, minHeight: 36 }}
                >
                  {kind.action}
                </Button>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
