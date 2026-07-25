"use client";

import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary print:hidden inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
    >
      <DownloadSimple size={16} weight="bold" />
      Save as PDF
    </button>
  );
}
