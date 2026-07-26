import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

/** Simple offset pagination via a `?page=` query param — no client JS needed. */
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
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={`${basePath}?page=${page - 1}`}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-muted"
          >
            <CaretLeft size={12} />
            Previous
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-50">
            <CaretLeft size={12} />
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={`${basePath}?page=${page + 1}`}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-muted"
          >
            Next
            <CaretRight size={12} />
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-50">
            Next
            <CaretRight size={12} />
          </span>
        )}
      </div>
    </div>
  );
}
