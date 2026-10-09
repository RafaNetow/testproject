import Avatar from "@mui/material/Avatar";
import List from "@mui/material/List";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ViewKanbanOutlined from "@mui/icons-material/ViewKanbanOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";

export type ActivityItem = {
  type: "card" | "decision" | "update" | "meeting" | "file";
  label: string;
  at: string;
  href: string;
  /** Second line — e.g. which client it belongs to. */
  sublabel?: string;
};

const ICONS = {
  card: ViewKanbanOutlined,
  decision: ForumOutlined,
  update: EditNoteOutlined,
  meeting: VideocamOutlined,
  file: FolderOpenOutlined,
};

export function ActivityFeed({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: ActivityItem[];
  emptyText: string;
}) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Typography variant="h2" sx={{ px: 3, pt: 3, pb: 1, fontSize: 18 }}>
        {title}
      </Typography>
      {!items.length ? (
        <Typography sx={{ px: 3, pt: 2, pb: 4, fontSize: 14, color: "text.muted" }}>{emptyText}</Typography>
      ) : (
        <>
          <List disablePadding sx={{ px: 1, pb: 1 }}>
            {items.map((item, i) => {
              const ItemIcon = ICONS[item.type];
              return (
                <ListItemButton
                  key={`${item.href}-${i}`}
                 
                  href={item.href}
                  sx={{ borderRadius: 1, px: 2, py: 1.25 }}
                >
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
                        color: "primary.main",
                      }}
                    >
                      <ItemIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.label}
                    secondary={item.sublabel}
                    slotProps={{
                      primary: { noWrap: true, sx: { fontSize: 14, fontWeight: 600 } },
                      secondary: { sx: { fontSize: 12, color: "text.muted" } },
                    }}
                  />
                  <Typography sx={{ ml: 2, flexShrink: 0, fontSize: 12, color: "text.muted" }}>
                    {new Date(item.at).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                  </Typography>
                </ListItemButton>
              );
            })}
          </List>
        </>
      )}
    </Paper>
  );
}
