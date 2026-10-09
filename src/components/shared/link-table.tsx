import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { LinkBox } from "./link-box";

export type LinkTableRow = { key: string; href: string; cells: ReactNode[] };

/**
 * A table whose rows are whole-row links. Each cell wraps its content in the
 * same link so the click target fills the row without nesting a link in a `<tr>`.
 * The first column renders emphasized; the rest in secondary text.
 */
export function LinkTable({
  columns,
  rows,
  align,
}: {
  columns: string[];
  rows: LinkTableRow[];
  align?: ("left" | "right")[];
}) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c, i) => (
              <TableCell key={c} align={align?.[i]} sx={{ px: 2.5, whiteSpace: "nowrap" }}>
                {c}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
              {row.cells.map((cell, i) => (
                <TableCell key={i} sx={{ p: 0 }}>
                  <LinkBox
                    href={row.href}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: align?.[i] === "right" ? "flex-end" : "flex-start",
                      px: 2.5,
                      py: 1.75,
                      color: i === 0 ? "text.primary" : "text.secondary",
                      fontWeight: i === 0 ? 500 : 400,
                      textDecoration: "none",
                    }}
                  >
                    {cell}
                  </LinkBox>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
