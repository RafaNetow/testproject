import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CreateNewFolderOutlined from "@mui/icons-material/CreateNewFolderOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import Download from "@mui/icons-material/Download";
import Folder from "@mui/icons-material/Folder";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import NavigateNext from "@mui/icons-material/NavigateNext";
import NoteAddOutlined from "@mui/icons-material/NoteAddOutlined";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/board/auto-submit-select";
import { UploadForm } from "./upload-form";
import { FilePreviewDialog } from "./file-preview-dialog";
import { RenameButton } from "./rename-button";
import { createFolder, deleteFolder, deleteFile, moveFile, renameFolder, renameFile } from "@/lib/actions/files";

type FolderRow = { id: string; name: string; parent_folder_id: string | null };
type FileRow = {
  id: string;
  filename: string;
  size_bytes: number;
  version_tag: string | null;
  created_at: string;
  storage_path: string;
  folder_id: string | null;
  mime_type: string | null;
  url: string | null;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function folderHref(basePath: string, extraQuery: string | undefined, folderId: string | null) {
  const params = new URLSearchParams(extraQuery);
  if (folderId) params.set("folder", folderId);
  else params.delete("folder");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

const countSx = { ml: 1, flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 10, color: "text.muted" } as const;
const iconButtonSx = { color: "text.muted", "&:hover": { color: "primary.main" } } as const;

function TreeItem({
  href,
  label,
  count,
  active,
  depth,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  depth: number;
}) {
  const Icon = active ? Folder : FolderOutlined;
  return (
    <ListItemButton
     
      href={href}
      title={label}
      selected={active}
      sx={{
        borderRadius: 2,
        py: 0.5,
        pl: `${12 + depth * 14}px`,
        pr: 1.25,
        color: active ? "primary.main" : "text.secondary",
        "&.Mui-selected": { bgcolor: "action.selected" },
      }}
    >
      <ListItemIcon sx={{ minWidth: 26, color: active ? "primary.main" : "text.muted" }}>
        <Icon sx={{ fontSize: 16 }} />
      </ListItemIcon>
      <ListItemText
        primary={label}
        slotProps={{ primary: { noWrap: true, sx: { fontSize: 14, fontWeight: active ? 500 : 400 } } }}
      />
      <Box component="span" sx={countSx}>
        {count}
      </Box>
    </ListItemButton>
  );
}

function FolderTree({
  folders,
  fileCountByFolder,
  parentId,
  depth,
  currentFolderId,
  basePath,
  extraQuery,
}: {
  folders: FolderRow[];
  fileCountByFolder: Map<string, number>;
  parentId: string | null;
  depth: number;
  currentFolderId: string | null;
  basePath: string;
  extraQuery?: string;
}) {
  const children = folders
    .filter((f) => (f.parent_folder_id ?? null) === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!children.length) return null;

  return (
    <List disablePadding dense>
      {children.map((f) => (
        <li key={f.id}>
          <TreeItem
            href={folderHref(basePath, extraQuery, f.id)}
            label={f.name}
            count={fileCountByFolder.get(f.id) ?? 0}
            active={f.id === currentFolderId}
            depth={depth}
          />
          <FolderTree
            folders={folders}
            fileCountByFolder={fileCountByFolder}
            parentId={f.id}
            depth={depth + 1}
            currentFolderId={currentFolderId}
            basePath={basePath}
            extraQuery={extraQuery}
          />
        </li>
      ))}
    </List>
  );
}

export function FilesView({
  projectId,
  folders,
  files,
  currentFolderId,
  basePath,
  extraQuery,
  revalidatePaths,
  canManage,
}: {
  projectId: string;
  folders: FolderRow[];
  files: FileRow[];
  currentFolderId: string | null;
  basePath: string;
  extraQuery?: string;
  revalidatePaths: string[];
  canManage: boolean;
}) {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const breadcrumb: FolderRow[] = [];
  for (let cur = currentFolderId; cur; ) {
    const f = byId.get(cur);
    if (!f) break;
    breadcrumb.unshift(f);
    cur = f.parent_folder_id;
  }

  const subfolders = folders.filter((f) => (f.parent_folder_id ?? null) === currentFolderId);
  const filesHere = files.filter((f) => (f.folder_id ?? null) === currentFolderId);
  const createInThisFolder = createFolder.bind(null, projectId, currentFolderId, revalidatePaths);

  const moveOptions = [
    { value: "__root__", label: "Top level" },
    ...folders
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({ value: f.id, label: f.name })),
  ];

  // Recursive file count per folder (includes files in nested subfolders),
  // computed bottom-up so the tree shows "how much is really in here".
  const directCount = new Map<string, number>();
  for (const f of files) {
    if (f.folder_id) directCount.set(f.folder_id, (directCount.get(f.folder_id) ?? 0) + 1);
  }
  const childrenOf = new Map<string | null, FolderRow[]>();
  for (const f of folders) {
    const key = f.parent_folder_id ?? null;
    childrenOf.set(key, [...(childrenOf.get(key) ?? []), f]);
  }
  const fileCountByFolder = new Map<string, number>();
  function countFolder(folderId: string): number {
    if (fileCountByFolder.has(folderId)) return fileCountByFolder.get(folderId)!;
    let total = directCount.get(folderId) ?? 0;
    for (const child of childrenOf.get(folderId) ?? []) total += countFolder(child.id);
    fileCountByFolder.set(folderId, total);
    return total;
  }
  for (const f of folders) countFolder(f.id);

  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 3, lg: 4 },
        gridTemplateColumns: { xs: "1fr", lg: "220px 1fr" },
        alignItems: "start",
      }}
    >
      <Paper
        component="nav"
        aria-label="Folder tree"
        variant="outlined"
        sx={{ p: 1.5, position: { lg: "sticky" }, top: { lg: 24 } }}
      >
        <List disablePadding dense>
          <li>
            <TreeItem
              href={folderHref(basePath, extraQuery, null)}
              label="All files"
              count={files.length}
              active={!currentFolderId}
              depth={0}
            />
          </li>
        </List>
        <FolderTree
          folders={folders}
          fileCountByFolder={fileCountByFolder}
          parentId={null}
          depth={1}
          currentFolderId={currentFolderId}
          basePath={basePath}
          extraQuery={extraQuery}
        />
      </Paper>

      <Stack spacing={3}>
        <Breadcrumbs separator={<NavigateNext sx={{ fontSize: 16 }} />} aria-label="Folder path" sx={{ fontSize: 14 }}>
          <MuiLink
           
            href={folderHref(basePath, extraQuery, null)}
            color={currentFolderId ? "text.muted" : "text.primary"}
            sx={{ fontWeight: currentFolderId ? 400 : 500 }}
          >
            Files
          </MuiLink>
          {breadcrumb.map((f, i) => (
            <MuiLink
              key={f.id}
             
              href={folderHref(basePath, extraQuery, f.id)}
              color={i === breadcrumb.length - 1 ? "text.primary" : "text.muted"}
              sx={{ fontWeight: i === breadcrumb.length - 1 ? 500 : 400 }}
            >
              {f.name}
            </MuiLink>
          ))}
        </Breadcrumbs>

        {canManage && (
          <Box component="form" action={createInThisFolder} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField name="name" required placeholder="New folder name" fullWidth={false} sx={{ width: 240 }} slotProps={{ htmlInput: { "aria-label": "New folder name" } }} />
            <Button type="submit" variant="outlined" color="secondary" startIcon={<CreateNewFolderOutlined />}>
              New folder
            </Button>
          </Box>
        )}

        {subfolders.length > 0 && (
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
            {subfolders.map((f) => {
              const deleteThis = deleteFolder.bind(null, f.id, revalidatePaths);
              const renameThis = renameFolder.bind(null, f.id, revalidatePaths);
              return (
                <Paper
                  key={f.id}
                  variant="outlined"
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, px: 2, py: 1.25 }}
                >
                  <MuiLink
                   
                    href={folderHref(basePath, extraQuery, f.id)}
                    underline="none"
                    color="text.primary"
                    sx={{ display: "flex", minWidth: 0, flex: 1, alignItems: "center", gap: 1.25, fontSize: 14, fontWeight: 500 }}
                  >
                    <Folder sx={{ fontSize: 19, color: "primary.main", flexShrink: 0 }} />
                    <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </Box>
                  </MuiLink>
                  {canManage && (
                    <form action={renameThis}>
                      <RenameButton
                        fieldName="name"
                        currentValue={f.name}
                        promptText="Rename folder"
                        ariaLabel={`Rename folder ${f.name}`}
                      />
                    </form>
                  )}
                  {canManage && (
                    <form action={deleteThis}>
                      <ConfirmButton
                        confirmText={`Delete "${f.name}"? Any subfolders go with it, and files inside move to the top level.`}
                        ariaLabel={`Delete folder ${f.name}`}
                        icon={<DeleteOutlined sx={{ fontSize: 16 }} />}
                      />
                    </form>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}

        <UploadForm projectId={projectId} folderId={currentFolderId} revalidatePaths={revalidatePaths} />

        {!filesHere.length ? (
          <Paper
            variant="outlined"
            sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, borderStyle: "dashed", px: 3, py: 5, textAlign: "center" }}
          >
            <NoteAddOutlined sx={{ fontSize: 22, color: "text.muted" }} />
            <Typography sx={{ fontSize: 14, color: "text.muted" }}>
              {subfolders.length ? "No files at this level." : "No files or folders yet."}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ borderTop: 1, borderColor: "divider" }}>
            {filesHere.map((f) => {
              const deleteThis = deleteFile.bind(null, f.id, f.storage_path, revalidatePaths);
              const moveThis = moveFile.bind(null, f.id, revalidatePaths);
              const renameThis = renameFile.bind(null, f.id, revalidatePaths);
              return (
                <Box
                  key={f.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                    py: 1.75,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 1.5 }}>
                    <DescriptionOutlined sx={{ fontSize: 21, color: "text.muted", flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }}>
                        {f.filename}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "text.muted" }}>
                        {formatSize(f.size_bytes)} · {new Date(f.created_at).toLocaleDateString("en-GB")}
                        {f.version_tag ? ` · ${f.version_tag}` : ""}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 0.5 }}>
                    {canManage && (
                      <form action={moveThis}>
                        <AutoSubmitSelect
                          name="folder_id"
                          defaultValue={f.folder_id ?? "__root__"}
                          options={moveOptions}
                          ariaLabel={`Folder for ${f.filename}`}
                        />
                      </form>
                    )}
                    {f.url && (
                      <>
                        <FilePreviewDialog filename={f.filename} url={f.url} mimeType={f.mime_type} />
                        <IconButton
                          component="a"
                          href={f.url}
                          download={f.filename}
                          size="small"
                          title="Download"
                          aria-label={`Download "${f.filename}"`}
                          sx={iconButtonSx}
                        >
                          <Download sx={{ fontSize: 18 }} />
                        </IconButton>
                      </>
                    )}
                    {canManage && (
                      <form action={renameThis}>
                        <RenameButton
                          fieldName="filename"
                          currentValue={f.filename}
                          promptText="Rename file"
                          ariaLabel={`Rename file ${f.filename}`}
                        />
                      </form>
                    )}
                    {canManage && (
                      <form action={deleteThis}>
                        <ConfirmButton
                          confirmText={`Delete "${f.filename}"? This can't be undone.`}
                          ariaLabel={`Delete file "${f.filename}"`}
                          icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
                        />
                      </form>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
