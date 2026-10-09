"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import MuiPagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import Typography from "@mui/material/Typography";

/** Offset pagination via a `?page=` query param — every page is a real link. */
export function Pagination({
  page,
  pageSize,
  total,
  basePath,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
      <Typography sx={{ fontSize: 14, color: "text.muted" }}>
        Page {page} of {totalPages} · {total} total
      </Typography>
      <MuiPagination
        page={page}
        count={totalPages}
        size="small"
        shape="rounded"
        renderItem={(item) => (
          <PaginationItem component={Link} href={`${basePath}?page=${item.page}`} {...item} />
        )}
      />
    </Box>
  );
}
