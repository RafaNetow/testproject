import Link from "next/link";
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
    <div>
      <Typography component="h2" sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}>
        {title}
      </Typography>
      {!items.length ? (
        <Paper variant="outlined" sx={{ mt: 1.5, borderStyle: "dashed", px: 3, py: 5, textAlign: "center" }}>
          <Typography sx={{ fontSize: 14, color: "text.muted" }}>{emptyText}</Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ mt: 1.5, overflow: "hidden" }}>
          <List disablePadding>
            {items.map((item, i) => {
              const ItemIcon = ICONS[item.type];
              return (
                <ListItemButton
                  key={`${item.href}-${i}`}
                 
                  href={item.href}
                  divider={i < items.length - 1}
                  sx={{ px: 2.5, py: 1.25 }}
                >
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "var(--color-muted)", color: "text.muted" }}>
                      <ItemIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.label}
                    secondary={item.sublabel}
                    slotProps={{
                      primary: { noWrap: true, sx: { fontSize: 14 } },
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
        </Paper>
      )}
    </div>
  );
}
