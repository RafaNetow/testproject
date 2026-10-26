"use client";

import { useMemo, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import {
  CloudUploadOutlined,
  ContentCopy,
  CreateNewFolderOutlined,
  DeleteOutlined,
  Download,
  DriveFileMoveOutlined,
  EditOutlined,
  ExpandMore,
  FolderOpenOutlined,
  GridViewOutlined,
  InfoOutlined,
  MoreVert,
  NavigateNext,
  NoteAddOutlined,
  StarFilled,
  StarOutline,
  ViewListOutlined,
  VisibilityOutlined,
} from "@/components/icons";
import { TechniqueLabel } from "@/components/shared/technique-label";
import { notifySuccess } from "@/components/shared/success-toast";
import { createFolder, deleteFiles, deleteFolder, moveFiles, renameFile, renameFolder, toggleFavorite } from "@/lib/actions/files";
import { NO_FILTERS, fileType, filterFiles, filterFolders, folderHref, formatSize, hasFilters, type FileFilters as Filters } from "@/lib/file-manager";
import { FileDetailsDrawer, canPreview } from "./file-details-drawer";
import { FileFilters, FilterResults } from "./file-filters";
import { FileTypeIcon, FolderYellow } from "./file-icons";
import { FilePreviewDialog } from "./file-preview-dialog";
import { MoveDialog } from "./move-dialog";
import { NameDialog } from "./name-dialog";
import { UploadDialog } from "./upload-dialog";

export type ManagerFile = {
  id: string;
  filename: string;
  size_bytes: number;
  version_tag: string | null;
  created_at: string;
  folder_id: string | null;
  mime_type: string | null;
  url: string | null;
  technique: string | null;
  favourite: boolean;
  uploaderName: string | null;
};

export type ManagerFolder = { id: string; name: string; count: number; size: number; favourite: boolean; created_at: string };

type SortKey = "name" | "size" | "type" | "modified";
type Item = { kind: "folder"; folder: ManagerFolder } | { kind: "file"; file: ManagerFile };

// The list/grid choice, remembered on this browser.
const VIEW_KEY = "alchemica-files-view";
const VIEW_EVENT = "alchemica:files-view";
function subscribeView(cb: () => void) {
  window.addEventListener(VIEW_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(VIEW_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function readView(): "list" | "grid" {
  try {
    return localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}
function saveView(v: "list" | "grid") {
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {
    // Private mode: the choice lasts until the page reloads.
  }
  window.dispatchEvent(new Event(VIEW_EVENT));
}

const modified = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Copenhagen" });
const STAR = "#FFAB00";

/**
 * The File Manager, after Minimal's: search, Type / date / technique /
 * favourites filters, list or grid, yellow folders, stars, a ⋯ menu per item,
 * selection with bulk actions, a details drawer, and Upload / New folder
 * dialogs. Admin-only actions (rename, move, delete, folders) are hidden from
 * clients; RLS enforces the same on the server.
 */
export function FileManager({
  projectId,
  currentFolderId,
  currentFolderName,
  breadcrumb,
  folders,
  files,
  moveTargets,
  techniques,
  initialTechnique,
  openFileId,
  basePath,
  extraQuery,
  revalidatePaths,
  canManage,
}: {
  projectId: string;
  currentFolderId: string | null;
  currentFolderName: string;
  breadcrumb: { id: string; name: string }[];
  folders: ManagerFolder[];
  files: ManagerFile[];
  moveTargets: { id: string; name: string; path: string }[];
  techniques: string[];
  initialTechnique: string | null;
  openFileId: string | null;
  basePath: string;
  extraQuery?: string;
  revalidatePaths: string[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const view = useSyncExternalStore(subscribeView, readView, () => "list" as const);
  const [filters, setFilters] = useState<Filters>({ ...NO_FILTERS, technique: initialTechnique && techniques.includes(initialTechnique) ? initialTechnique : null });
  const [stars, setStars] = useState<Map<string, boolean>>(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ by: SortKey; dir: "asc" | "desc" }>({ by: "modified", dir: "desc" });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [dense, setDense] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [details, setDetails] = useState<string | null>(openFileId);
  const [preview, setPreview] = useState<ManagerFile | null>(null);
  const [upload, setUpload] = useState(false);
  const [newFolder, setNewFolder] = useState(false);
  const [rename, setRename] = useState<Item | null>(null);
  const [moving, setMoving] = useState<string[] | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; run: () => Promise<void> } | null>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: Item } | null>(null);

  const isStarred = (kind: "file" | "folder", id: string, fallback: boolean) => stars.get(`${kind}:${id}`) ?? fallback;
  const withStars = useMemo(
    () => ({
      files: files.map((f) => ({ ...f, favourite: stars.get(`file:${f.id}`) ?? f.favourite })),
      folders: folders.map((d) => ({ ...d, favourite: stars.get(`folder:${d.id}`) ?? d.favourite })),
    }),
    [files, folders, stars]
  );

  const shownFolders = useMemo(() => {
    const list = filterFolders(withStars.folders, filters).slice();
    list.sort((a, b) => a.name.localeCompare(b.name) * (sort.by === "name" && sort.dir === "desc" ? -1 : 1));
    return list;
  }, [withStars.folders, filters, sort]);

  const shownFiles = useMemo(() => {
    const list = filterFiles(withStars.files, filters).slice();
    const dir = sort.dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sort.by === "name") return a.filename.localeCompare(b.filename) * dir;
      if (sort.by === "size") return (a.size_bytes - b.size_bytes) * dir;
      if (sort.by === "type") return fileType(a.filename, a.mime_type).label.localeCompare(fileType(b.filename, b.mime_type).label) * dir;
      return a.created_at.localeCompare(b.created_at) * dir;
    });
    return list;
  }, [withStars.files, filters, sort]);

  const items: Item[] = [...shownFolders.map((folder) => ({ kind: "folder" as const, folder })), ...shownFiles.map((file) => ({ kind: "file" as const, file }))];
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = items.slice(safePage * perPage, safePage * perPage + perPage);
  const detailsFile = withStars.files.find((f) => f.id === details) ?? null;
  const selectedFiles = shownFiles.filter((f) => selected.has(f.id));
  const allSelected = shownFiles.length > 0 && selectedFiles.length === shownFiles.length;

  function changeFilters(next: Filters) {
    setFilters(next);
    setPage(0);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function star(kind: "file" | "folder", id: string, current: boolean) {
    const key = `${kind}:${id}`;
    setStars((prev) => new Map(prev).set(key, !current));
    toggleFavorite(kind, id, revalidatePaths).catch(() => setStars((prev) => new Map(prev).set(key, current)));
  }

  function copyLink(href: string) {
    const url = `${window.location.origin}${href}`;
    navigator.clipboard?.writeText(url).then(
      () => notifySuccess("Link copied"),
      () => window.prompt("Copy this link", url)
    );
  }

  function downloadAll(list: ManagerFile[]) {
    // One link per file; browsers allow several downloads from one click.
    for (const f of list) {
      if (!f.url) continue;
      const a = document.createElement("a");
      a.href = f.url;
      a.download = f.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  function askDeleteFiles(list: ManagerFile[]) {
    setConfirm({
      title: list.length === 1 ? "Delete file?" : `Delete ${list.length} files?`,
      body: list.length === 1 ? `"${list[0].filename}" will be deleted. This can't be undone.` : "These files will be deleted. This can't be undone.",
      run: async () => {
        await deleteFiles(list.map((f) => f.id), revalidatePaths);
        setSelected(new Set());
        if (details && list.some((f) => f.id === details)) setDetails(null);
        notifySuccess(list.length === 1 ? `Deleted "${list[0].filename}"` : `Deleted ${list.length} files`);
      },
    });
  }

  function askDeleteFolder(folder: ManagerFolder) {
    setConfirm({
      title: "Delete folder?",
      body: `"${folder.name}" and any folders inside it will be deleted. Files inside move to the top level.`,
      run: async () => {
        await deleteFolder(folder.id, revalidatePaths);
        notifySuccess(`Deleted "${folder.name}"`);
      },
    });
  }

  const openFolder = (id: string) => startTransition(() => router.push(folderHref(basePath, extraQuery, id)));
  const sortBy = (by: SortKey) => setSort((s) => ({ by, dir: s.by === by && s.dir === "asc" ? "desc" : "asc" }));
  const cellPy = dense ? 0.75 : 1.5;

  const starButton = (kind: "file" | "folder", id: string, on: boolean, name: string) => (
    <Tooltip title={on ? "Remove from favourites" : "Add to favourites"}>
      <IconButton
        size="small"
        aria-label={`${on ? "Unstar" : "Star"} ${name}`}
        aria-pressed={on}
        onClick={(e) => {
          e.stopPropagation();
          star(kind, id, on);
        }}
        sx={{ color: on ? STAR : "text.muted", "&:hover": { color: STAR } }}
      >
        {on ? <StarFilled sx={{ fontSize: 18 }} /> : <StarOutline sx={{ fontSize: 18 }} />}
      </IconButton>
    </Tooltip>
  );

  const moreButton = (item: Item, name: string) => (
    <IconButton
      size="small"
      aria-label={`More actions for ${name}`}
      aria-haspopup="menu"
      onClick={(e) => {
        e.stopPropagation();
        setMenu({ anchor: e.currentTarget, item });
      }}
      sx={{ color: "text.muted" }}
    >
      <MoreVert sx={{ fontSize: 18 }} />
    </IconButton>
  );

  return (
    <Stack spacing={2.5}>
      {/* Toolbar: filters on the left; view, New folder and Upload on the right. */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <FileFilters value={filters} onChange={changeFilters} techniques={techniques} />
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, ml: { md: "auto" } }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, v: "list" | "grid" | null) => v && saveView(v)}
            aria-label="View"
            sx={{ "& .MuiToggleButton-root": { width: 40, height: 40, border: "1px solid var(--border-control)" } }}
          >
            <ToggleButton value="list" aria-label="List view">
              <ViewListOutlined sx={{ fontSize: 20 }} />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="Grid view">
              <GridViewOutlined sx={{ fontSize: 20 }} />
            </ToggleButton>
          </ToggleButtonGroup>
          {canManage && (
            <Button variant="outlined" color="inherit" startIcon={<CreateNewFolderOutlined />} onClick={() => setNewFolder(true)} sx={{ height: 40, borderColor: "var(--border-control)", fontWeight: 600, whiteSpace: "nowrap" }}>
              New folder
            </Button>
          )}
          <Button variant="contained" startIcon={<CloudUploadOutlined />} onClick={() => setUpload(true)} sx={{ height: 40, whiteSpace: "nowrap" }}>
            Upload
          </Button>
        </Box>
      </Box>

      <Breadcrumbs separator={<NavigateNext sx={{ fontSize: 16 }} />} aria-label="Folder path" sx={{ fontSize: 14 }}>
        <MuiLink href={folderHref(basePath, extraQuery, null)} color={currentFolderId ? "text.secondary" : "text.primary"} underline="hover" sx={{ fontWeight: 600 }}>
          All files
        </MuiLink>
        {breadcrumb.map((f, i) => (
          <MuiLink key={f.id} href={folderHref(basePath, extraQuery, f.id)} color={i === breadcrumb.length - 1 ? "text.primary" : "text.secondary"} underline="hover" sx={{ fontWeight: 600 }}>
            {f.name}
          </MuiLink>
        ))}
      </Breadcrumbs>

      <FilterResults value={filters} onChange={changeFilters} total={shownFolders.length + shownFiles.length} />

      {/* Bulk bar, as on Minimal tables, while files are selected. */}
      {selectedFiles.length > 0 && (
        <Paper
          role="toolbar"
          aria-label="Selected files"
          sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, bgcolor: "color-mix(in srgb, var(--color-accent) 10%, var(--color-card))", boxShadow: "none" }}
        >
          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={!allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(shownFiles.map((f) => f.id)))}
            slotProps={{ input: { "aria-label": allSelected ? "Unselect all" : "Select all" } }}
          />
          <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 700, color: "primary.main" }}>{selectedFiles.length} selected</Typography>
          <Tooltip title="Download">
            <IconButton aria-label="Download selected" onClick={() => downloadAll(selectedFiles)} sx={{ color: "primary.main" }}>
              <Download sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          {canManage && (
            <>
              <Tooltip title="Move">
                <IconButton aria-label="Move selected" onClick={() => setMoving(selectedFiles.map((f) => f.id))} sx={{ color: "primary.main" }}>
                  <DriveFileMoveOutlined sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton aria-label="Delete selected" onClick={() => askDeleteFiles(selectedFiles)} sx={{ color: "error.main" }}>
                  <DeleteOutlined sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Paper>
      )}

      {items.length === 0 ? (
        <Paper variant="outlined" sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, px: 3, py: 7, textAlign: "center" }}>
          {hasFilters(filters) ? <FolderOpenOutlined sx={{ fontSize: 36, color: "text.muted" }} /> : <NoteAddOutlined sx={{ fontSize: 36, color: "text.muted" }} />}
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{hasFilters(filters) ? "Nothing matches these filters" : "No files or folders yet"}</Typography>
          <Typography sx={{ fontSize: 13, color: "text.muted" }}>{hasFilters(filters) ? "Try other filters, or clear them." : "Use Upload to add the first file here."}</Typography>
        </Paper>
      ) : view === "list" ? (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <TableContainer>
            <Table size={dense ? "small" : "medium"} sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: "var(--fill-track)", color: "text.secondary", fontWeight: 600, fontSize: 13, borderBottom: 0 } }}>
                  <TableCell padding="checkbox" sx={{ pl: 1 }}>
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      indeterminate={selectedFiles.length > 0 && !allSelected}
                      disabled={!shownFiles.length}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(shownFiles.map((f) => f.id)))}
                      slotProps={{ input: { "aria-label": "Select all files" } }}
                    />
                  </TableCell>
                  {(
                    [
                      ["name", "Name"],
                      ["size", "Size"],
                      ["type", "Type"],
                    ] as const
                  ).map(([key, label]) => (
                    <TableCell key={key} sortDirection={sort.by === key ? sort.dir : false}>
                      <TableSortLabel active={sort.by === key} direction={sort.by === key ? sort.dir : "asc"} onClick={() => sortBy(key)}>
                        {label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell>Technique</TableCell>
                  <TableCell sortDirection={sort.by === "modified" ? sort.dir : false}>
                    <TableSortLabel active={sort.by === "modified"} direction={sort.by === "modified" ? sort.dir : "asc"} onClick={() => sortBy("modified")}>
                      Modified
                    </TableSortLabel>
                  </TableCell>
                  {/* Positioned so the hidden label stays inside the table's scroll area (else it widens the page on phones). */}
                  <TableCell align="right" sx={{ pr: 1.5, position: "relative" }}>
                    <Box component="span" sx={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
                      Actions
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody className="stagger">
                {pageItems.map((item) =>
                  item.kind === "folder" ? (
                    <TableRow key={`d-${item.folder.id}`} hover onClick={() => openFolder(item.folder.id)} sx={{ cursor: "pointer" }}>
                      <TableCell padding="checkbox" />
                      <TableCell sx={{ py: cellPy, maxWidth: 320 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                          <FolderYellow size={dense ? 30 : 36} />
                          <MuiLink href={folderHref(basePath, extraQuery, item.folder.id)} onClick={(e) => e.stopPropagation()} color="text.primary" underline="hover" noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                            {item.folder.name}
                          </MuiLink>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{formatSize(item.folder.size)}</TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                        Folder · {item.folder.count} {item.folder.count === 1 ? "file" : "files"}
                      </TableCell>
                      <TableCell />
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{modified(item.folder.created_at)}</TableCell>
                      <TableCell align="right" sx={{ pr: 1, whiteSpace: "nowrap" }}>
                        {starButton("folder", item.folder.id, item.folder.favourite, item.folder.name)}
                        {moreButton(item, item.folder.name)}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={`f-${item.file.id}`} hover selected={selected.has(item.file.id)} onClick={() => setDetails(item.file.id)} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell padding="checkbox" sx={{ pl: 1 }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox size="small" checked={selected.has(item.file.id)} onChange={() => toggleSelect(item.file.id)} slotProps={{ input: { "aria-label": `Select ${item.file.filename}` } }} />
                      </TableCell>
                      <TableCell sx={{ py: cellPy, maxWidth: 320 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                          <FileTypeIcon filename={item.file.filename} mime={item.file.mime_type} size={dense ? 30 : 36} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                              {item.file.filename}
                            </Typography>
                            {!dense && item.file.uploaderName && (
                              <Typography noWrap sx={{ fontSize: 12, color: "text.muted" }}>
                                {item.file.uploaderName}
                                {item.file.version_tag ? ` · ${item.file.version_tag}` : ""}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{formatSize(item.file.size_bytes)}</TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{fileType(item.file.filename, item.file.mime_type).label}</TableCell>
                      <TableCell>
                        <TechniqueLabel label={item.file.technique} />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{modified(item.file.created_at)}</TableCell>
                      <TableCell align="right" sx={{ pr: 1, whiteSpace: "nowrap" }}>
                        {starButton("file", item.file.id, item.file.favourite, item.file.filename)}
                        {moreButton(item, item.file.filename)}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider />
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", pl: 2 }}>
            <FormControlLabel control={<Switch size="small" checked={dense} onChange={(e) => setDense(e.target.checked)} />} label="Dense" slotProps={{ typography: { sx: { fontSize: 14 } } }} />
            <TablePagination
              component="div"
              count={items.length}
              page={safePage}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={perPage}
              onRowsPerPageChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{ ml: "auto", borderBottom: 0 }}
            />
          </Box>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {shownFolders.length > 0 && (
            <section aria-labelledby="folders-heading">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <ButtonBase onClick={() => setFoldersOpen((o) => !o)} aria-expanded={foldersOpen} sx={{ gap: 0.5, borderRadius: 1, px: 0.5 }}>
                  <Typography id="folders-heading" variant="h2" sx={{ fontSize: 18 }}>
                    Folders
                  </Typography>
                  <ExpandMore sx={{ fontSize: 18, transition: "transform 200ms", transform: foldersOpen ? "none" : "rotate(-90deg)" }} />
                </ButtonBase>
                <Count n={shownFolders.length} />
              </Box>
              <Collapse in={foldersOpen}>
                <Box className="stagger" sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
                  {shownFolders.map((d) => (
                    <Card key={d.id} onOpen={() => openFolder(d.id)}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <FolderYellow size={48} />
                        <Box sx={{ display: "flex", mr: -1, mt: -0.5 }}>
                          {starButton("folder", d.id, d.favourite, d.name)}
                          {moreButton({ kind: "folder", folder: d }, d.name)}
                        </Box>
                      </Box>
                      <Typography noWrap sx={{ mt: 1.5, fontSize: 15, fontWeight: 600 }}>
                        {d.name}
                      </Typography>
                      <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.muted" }}>
                        {d.count} {d.count === 1 ? "file" : "files"} · {formatSize(d.size)}
                      </Typography>
                    </Card>
                  ))}
                </Box>
              </Collapse>
            </section>
          )}
          {shownFiles.length > 0 && (
            <section aria-labelledby="files-heading">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Typography id="files-heading" variant="h2" sx={{ fontSize: 18 }}>
                  Files
                </Typography>
                <Count n={shownFiles.length} />
              </Box>
              <Box className="stagger" sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
                {shownFiles.map((f) => (
                  <Card key={f.id} selected={selected.has(f.id)} onOpen={() => setDetails(f.id)}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <Box sx={{ position: "relative" }}>
                        <FileTypeIcon filename={f.filename} mime={f.mime_type} size={48} />
                        <Checkbox
                          size="small"
                          checked={selected.has(f.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleSelect(f.id)}
                          className="card-check"
                          slotProps={{ input: { "aria-label": `Select ${f.filename}` } }}
                          sx={{ position: "absolute", inset: 0, m: "auto", width: 40, height: 40, bgcolor: "background.paper", borderRadius: "50%", opacity: selected.has(f.id) ? 1 : 0, transition: "opacity 150ms", "&:focus-visible, .Mui-focusVisible &": { opacity: 1 } }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", mr: -1, mt: -0.5 }}>
                        {starButton("file", f.id, f.favourite, f.filename)}
                        {moreButton({ kind: "file", file: f }, f.filename)}
                      </Box>
                    </Box>
                    <Typography noWrap sx={{ mt: 1.5, fontSize: 14, fontWeight: 600 }}>
                      {f.filename}
                    </Typography>
                    <Typography noWrap sx={{ mt: 0.5, fontSize: 12, color: "text.muted" }}>
                      {formatSize(f.size_bytes)} · {modified(f.created_at)}
                    </Typography>
                  </Card>
                ))}
              </Box>
            </section>
          )}
        </Stack>
      )}

      {/* ⋯ menu for the item it was opened on. */}
      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 200 } }, list: { dense: true } }}
      >
        {menu?.item.kind === "folder"
          ? [
              <MenuItem key="open" onClick={() => (openFolder((menu.item as { folder: ManagerFolder }).folder.id), setMenu(null))}>
                <ListItemIcon><FolderOpenOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
                Open
              </MenuItem>,
              <MenuItem key="link" onClick={() => (copyLink(folderHref(basePath, extraQuery, (menu.item as { folder: ManagerFolder }).folder.id)), setMenu(null))}>
                <ListItemIcon><ContentCopy sx={{ fontSize: 18 }} /></ListItemIcon>
                Copy link
              </MenuItem>,
              ...(canManage
                ? [
                    <MenuItem key="rename" onClick={() => (setRename(menu.item), setMenu(null))}>
                      <ListItemIcon><EditOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
                      Rename
                    </MenuItem>,
                    <Divider key="div" />,
                    <MenuItem key="delete" onClick={() => (askDeleteFolder((menu.item as { folder: ManagerFolder }).folder), setMenu(null))} sx={{ color: "error.main" }}>
                      <ListItemIcon sx={{ color: "inherit" }}><DeleteOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
                      Delete
                    </MenuItem>,
                  ]
                : []),
            ]
          : menu?.item.kind === "file"
            ? (() => {
                const f = menu.item.file;
                return [
                  <MenuItem key="info" onClick={() => (setDetails(f.id), setMenu(null))}>
                    <ListItemIcon><InfoOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
                    Details
                  </MenuItem>,
                  <MenuItem key="preview" disabled={!canPreview(f)} onClick={() => (setPreview(f), setMenu(null))}>
                    <ListItemIcon><VisibilityOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
                    Preview
                  </MenuItem>,
                  <MenuItem key="download" disabled={!f.url} onClick={() => (downloadAll([f]), setMenu(null))}>
                    <ListItemIcon><Download sx={{ fontSize: 18 }} /></ListItemIcon>
                    Download
                  </MenuItem>,
                  <MenuItem key="link" onClick={() => (copyLink(folderHref(basePath, extraQuery, currentFolderId, f.id)), setMenu(null))}>
                    <ListItemIcon><ContentCopy sx={{ fontSize: 18 }} /></ListItemIcon>
                    Copy link
                  </MenuItem>,
                  ...(canManage
                    ? [
                        <MenuItem key="rename" onClick={() => (setRename(menu.item), setMenu(null))}>
                          <ListItemIcon><EditOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
                          Rename
                        </MenuItem>,
                        <MenuItem key="move" onClick={() => (setMoving([f.id]), setMenu(null))}>
                          <ListItemIcon><DriveFileMoveOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
                          Move to…
                        </MenuItem>,
                        <Divider key="div" />,
                        <MenuItem key="delete" onClick={() => (askDeleteFiles([f]), setMenu(null))} sx={{ color: "error.main" }}>
                          <ListItemIcon sx={{ color: "inherit" }}><DeleteOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
                          Delete
                        </MenuItem>,
                      ]
                    : []),
                ];
              })()
            : null}
      </Menu>

      <FileDetailsDrawer
        file={detailsFile}
        canManage={canManage}
        folderName={currentFolderName}
        revalidatePaths={revalidatePaths}
        onClose={() => setDetails(null)}
        onToggleStar={(f) => star("file", f.id, isStarred("file", f.id, f.favourite))}
        onPreview={(f) => setPreview(f)}
        onCopyLink={(f) => copyLink(folderHref(basePath, extraQuery, currentFolderId, f.id))}
        onDelete={(f) => askDeleteFiles([f])}
      />
      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
      <UploadDialog open={upload} onClose={() => setUpload(false)} projectId={projectId} folderId={currentFolderId} folderName={currentFolderName} revalidatePaths={revalidatePaths} />
      <NameDialog
        open={newFolder}
        title="New folder"
        label="Folder name"
        saveLabel="Create"
        onClose={() => setNewFolder(false)}
        onSave={async (name) => {
          const form = new FormData();
          form.set("name", name);
          await createFolder(projectId, currentFolderId, revalidatePaths, form);
          notifySuccess(`Created "${name}"`);
        }}
      />
      <NameDialog
        open={Boolean(rename)}
        title={rename?.kind === "folder" ? "Rename folder" : "Rename file"}
        label="Name"
        initial={rename?.kind === "folder" ? rename.folder.name : rename?.kind === "file" ? rename.file.filename : ""}
        saveLabel="Save"
        onClose={() => setRename(null)}
        onSave={async (name) => {
          if (!rename) return;
          const form = new FormData();
          if (rename.kind === "folder") {
            form.set("name", name);
            await renameFolder(rename.folder.id, revalidatePaths, form);
          } else {
            form.set("filename", name);
            await renameFile(rename.file.id, revalidatePaths, form);
          }
          notifySuccess(`Renamed to "${name}"`);
        }}
      />
      <MoveDialog
        open={Boolean(moving)}
        count={moving?.length ?? 0}
        currentFolderId={currentFolderId}
        folders={moveTargets}
        onClose={() => setMoving(null)}
        onMove={async (folderId) => {
          if (!moving) return;
          await moveFiles(moving, folderId, revalidatePaths);
          setSelected(new Set());
          notifySuccess(moving.length === 1 ? "File moved" : `${moving.length} files moved`);
        }}
      />
      <ConfirmDialog value={confirm} onClose={() => setConfirm(null)} />
    </Stack>
  );
}

function Count({ n }: { n: number }) {
  return (
    <Box component="span" sx={{ px: 0.75, height: 22, minWidth: 22, display: "inline-grid", placeItems: "center", borderRadius: 0.75, bgcolor: "var(--fill-neutral)", color: "text.secondary", fontSize: 12, fontWeight: 700 }}>
      {n}
    </Box>
  );
}

/** A grid card (folder or file): the whole card opens it; star, ⋯ and the checkbox sit above. */
function Card({ children, onOpen, selected = false }: { children: ReactNode; onOpen: () => void; selected?: boolean }) {
  return (
    <Paper
      variant="outlined"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      role="button"
      sx={{
        position: "relative",
        p: 2.5,
        cursor: "pointer",
        borderColor: selected ? "primary.main" : undefined,
        bgcolor: selected ? "color-mix(in srgb, var(--color-accent) 6%, var(--color-card))" : undefined,
        transition: "box-shadow 200ms, transform 150ms",
        "&:hover": { boxShadow: "var(--shadow-dropdown)", transform: "translateY(-2px)" },
        "&:hover .card-check, &:focus-within .card-check": { opacity: 1 },
        "&.Mui-focusVisible, &:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
      }}
    >
      {children}
    </Paper>
  );
}

function ConfirmDialog({ value, onClose }: { value: { title: string; body: string; run: () => Promise<void> } | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      await value.run();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={Boolean(value)} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth aria-labelledby="confirm-title">
      <DialogTitle id="confirm-title" sx={{ fontWeight: 700 }}>
        {value?.title}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{value?.body}</Typography>
        {error && <Typography sx={{ mt: 1.5, fontSize: 13, color: "error.main" }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="secondary" variant="outlined" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={run} loading={busy}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
