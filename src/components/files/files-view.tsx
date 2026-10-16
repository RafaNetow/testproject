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
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ConfirmButton } from "@/components/confirm-button";
import { STATUS_TONE, category, categorical, type Tone } from "@/lib/palette";
import { UploadForm } from "./upload-form";
import { FilePreviewDialog } from "./file-preview-dialog";
import { RenameButton } from "./rename-button";
import { TechniqueMenu } from "./technique-menu";
import { FileRowMenu } from "./file-row-menu";
import { createFolder, deleteFolder, deleteFile, renameFolder, renameFile } from "@/lib/actions/files";
import { FILE_LABELS } from "@/lib/techniques";
import { TechniqueLabel } from "@/components/shared/technique-label";
import { DataRequests, type DataRequestRow } from "./data-requests";
import { LinkBox } from "@/components/shared/link-box";
import { DeleteOutlined, Download, Folder, FolderOutlined, NavigateNext, NoteAddOutlined } from "@/components/icons";

/** Hidden from sight, still read by screen readers. */
const visuallyHidden = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const;

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
  technique: string | null;
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

/** A short type badge + hue per file kind, like a file manager's type icons. */
function fileType(filename: string, mime: string | null) {
  const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
  if (ext === "pdf" || mime === "application/pdf") return { label: "PDF", tone: STATUS_TONE.error };
  if (mime?.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return { label: "IMG", tone: category(4) };
  if (["xls", "xlsx", "csv"].includes(ext)) return { label: ext === "csv" ? "CSV" : "XLS", tone: STATUS_TONE.success };
  if (["doc", "docx", "txt", "md", "rtf"].includes(ext))
    return { label: ext === "txt" || ext === "md" ? "TXT" : "DOC", tone: STATUS_TONE.info };
  if (["ppt", "pptx"].includes(ext)) return { label: "PPT", tone: STATUS_TONE.warning };
  if (["zip", "rar", "7z", "gz"].includes(ext)) return { label: "ZIP", tone: category(3) };
  return { label: (ext.slice(0, 4) || "FILE").toUpperCase(), tone: STATUS_TONE.neutral };
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
  technique,
  requests = [],
  basePath,
  extraQuery,
  revalidatePaths,
  canManage,
}: {
  projectId: string;
  folders: FolderRow[];
  files: FileRow[];
  currentFolderId: string | null;
  /** Active technique filter (?technique=), or null for all. */
  technique?: string | null;
  /** Data Alchemica has asked the client for (shown above the files). */
  requests?: DataRequestRow[];
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
  // Only offer filters for labels that actually occur here, in the canonical order.
  const labelsHere = FILE_LABELS.filter((label) => filesHere.some((f) => f.technique === label));
  const activeTechnique = technique && labelsHere.includes(technique) ? technique : null;
  const visibleFiles = activeTechnique ? filesHere.filter((f) => f.technique === activeTechnique) : filesHere;
  const createInThisFolder = createFolder.bind(null, projectId, currentFolderId, revalidatePaths);

  const moveTargets = folders
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => ({ id: f.id, name: f.name }));

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
        gap: 3,
        gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "200px minmax(0, 1fr)" },
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

      <Stack spacing={4} sx={{ minWidth: 0 }}>
        <DataRequests
          projectId={projectId}
          requests={requests}
          files={Object.fromEntries(files.map((f) => [f.id, { filename: f.filename, url: f.url }]))}
          folders={folders.map((f) => ({ id: f.id, name: f.name }))}
          canManage={canManage}
          revalidatePaths={revalidatePaths}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Breadcrumbs separator={<NavigateNext sx={{ fontSize: 16 }} />} aria-label="Folder path" sx={{ fontSize: 14 }}>
            <MuiLink
              href={folderHref(basePath, extraQuery, null)}
              color={currentFolderId ? "text.secondary" : "text.primary"}
              sx={{ fontWeight: 600 }}
            >
              All files
            </MuiLink>
            {breadcrumb.map((f, i) => (
              <MuiLink
                key={f.id}
                href={folderHref(basePath, extraQuery, f.id)}
                color={i === breadcrumb.length - 1 ? "text.primary" : "text.secondary"}
                sx={{ fontWeight: 600 }}
              >
                {f.name}
              </MuiLink>
            ))}
          </Breadcrumbs>

          {canManage && (
            <Box component="form" action={createInThisFolder} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                name="name"
                required
                placeholder="New folder name"
                fullWidth={false}
                sx={{ width: { xs: 160, sm: 220 } }}
                slotProps={{ htmlInput: { "aria-label": "New folder name" } }}
              />
              <Button type="submit" variant="contained">
                New folder
              </Button>
            </Box>
          )}
        </Box>

        {subfolders.length > 0 && (
          <section>
            <SectionTitle title="Folders" count={subfolders.length} />
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
              }}
            >
              {subfolders
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((f) => {
                  const deleteThis = deleteFolder.bind(null, f.id, revalidatePaths);
                  const renameThis = renameFolder.bind(null, f.id, revalidatePaths);
                  const count = fileCountByFolder.get(f.id) ?? 0;
                  return (
                    <Paper
                      key={f.id}
                      variant="outlined"
                      sx={{
                        position: "relative",
                        p: 2.5,
                        transition: "box-shadow 200ms",
                        "&:hover": { boxShadow: "var(--shadow-dropdown)" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <Folder sx={{ fontSize: 44, color: "primary.main" }} />
                        {canManage && (
                          <Box sx={{ display: "flex", mr: -1, mt: -0.5, position: "relative", zIndex: 1 }}>
                            <form action={renameThis}>
                              <RenameButton
                                fieldName="name"
                                currentValue={f.name}
                                promptText="Rename folder"
                                ariaLabel={`Rename folder ${f.name}`}
                              />
                            </form>
                            <form action={deleteThis}>
                              <ConfirmButton
                                confirmText={`Delete "${f.name}"? Any subfolders go with it, and files inside move to the top level.`}
                                ariaLabel={`Delete folder ${f.name}`}
                                icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
                              />
                            </form>
                          </Box>
                        )}
                      </Box>
                      <MuiLink
                        href={folderHref(basePath, extraQuery, f.id)}
                        underline="none"
                        color="text.primary"
                        sx={{
                          mt: 1.5,
                          display: "block",
                          fontSize: 15,
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          // Stretch the link over the whole card; the action buttons sit above it.
                          "&::after": { content: '""', position: "absolute", inset: 0 },
                        }}
                      >
                        {f.name}
                      </MuiLink>
                      <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.muted" }}>
                        {count} {count === 1 ? "file" : "files"}
                      </Typography>
                    </Paper>
                  );
                })}
            </Box>
          </section>
        )}

        <UploadForm projectId={projectId} folderId={currentFolderId} revalidatePaths={revalidatePaths} />

        <section>
          <SectionTitle title="Files" count={visibleFiles.length} />
          {labelsHere.length > 0 && (
            <Box component="nav" aria-label="Filter by technique" sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              <FilterChip href={techniqueHref(basePath, extraQuery, currentFolderId, null)} active={!activeTechnique} label="All" />
              {labelsHere.map((label) => (
                <FilterChip
                  key={label}
                  href={techniqueHref(basePath, extraQuery, currentFolderId, label)}
                  active={activeTechnique === label}
                  label={label}
                  tone={categorical(label)}
                />
              ))}
            </Box>
          )}
          {!filesHere.length ? (
            <Paper
              variant="outlined"
              sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, px: 3, py: 6, textAlign: "center" }}
            >
              <NoteAddOutlined sx={{ fontSize: 32, color: "text.muted" }} />
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                {subfolders.length ? "No files at this level" : "No files or folders yet"}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "text.muted" }}>Upload one above to get started.</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2.5 }}>Name</TableCell>
                    <TableCell>Technique</TableCell>
                    <TableCell>Modified</TableCell>
                    <TableCell align="right" sx={{ pr: 2 }}>
                      <Box component="span" sx={visuallyHidden}>
                        Actions
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleFiles.map((f) => {
                    const deleteThis = deleteFile.bind(null, f.id, f.storage_path, revalidatePaths);
                    const renameThis = renameFile.bind(null, f.id, revalidatePaths);
                    const type = fileType(f.filename, f.mime_type);
                    return (
                      <TableRow key={f.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ pl: 2.5, py: 1.5, maxWidth: 280 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: "grid",
                                placeItems: "center",
                                width: 36,
                                height: 36,
                                flexShrink: 0,
                                borderRadius: 1,
                                bgcolor: type.tone.bg,
                                color: type.tone.text,
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: "0.02em",
                              }}
                            >
                              {type.label}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                                {f.filename}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: "text.muted" }}>
                                {formatSize(f.size_bytes)}
                                {f.version_tag ? ` · ${f.version_tag}` : ""}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ width: canManage ? 150 : undefined }}>
                          {canManage ? (
                            <TechniqueMenu fileId={f.id} filename={f.filename} technique={f.technique} revalidatePaths={revalidatePaths} />
                          ) : (
                            <TechniqueLabel label={f.technique} />
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                          {new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 1.5, whiteSpace: "nowrap" }}>
                          <Box sx={{ display: "inline-flex", alignItems: "center" }}>
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
                              <FileRowMenu
                                fileId={f.id}
                                filename={f.filename}
                                folderId={f.folder_id}
                                folders={moveTargets}
                                revalidatePaths={revalidatePaths}
                              />
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </section>
      </Stack>
    </Box>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="h2" sx={{ fontSize: 18 }}>
        {title}
      </Typography>
      <Box
        component="span"
        sx={{
          px: 0.75,
          height: 22,
          minWidth: 22,
          display: "inline-grid",
          placeItems: "center",
          borderRadius: 0.75,
          bgcolor: "var(--fill-neutral)",
          color: "text.secondary",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {count}
      </Box>
    </Box>
  );
}

function techniqueHref(basePath: string, extraQuery: string | undefined, folderId: string | null, technique: string | null) {
  const params = new URLSearchParams(extraQuery);
  if (folderId) params.set("folder", folderId);
  if (technique) params.set("technique", technique);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function FilterChip({ href, label, active, tone }: { href: string; label: string; active: boolean; tone?: Tone }) {
  return (
    <LinkBox
      href={href}
      aria-current={active ? "true" : undefined}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        height: 30,
        px: 1.5,
        borderRadius: 999,
        border: "1px solid",
        borderColor: active ? "text.primary" : "var(--border-outline)",
        bgcolor: active ? "text.primary" : "transparent",
        color: active ? "background.paper" : "text.secondary",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
        transition: "background-color 150ms, border-color 150ms",
        "&:hover": { borderColor: "text.primary" },
      }}
    >
      {tone && <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: tone.solid }} />}
      {label}
    </LinkBox>
  );
}
