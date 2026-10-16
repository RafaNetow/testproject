"use client";

import { useFormStatus } from "react-dom";
import Button, { type ButtonProps } from "@mui/material/Button";

/**
 * A submit button that shows it is working: while the surrounding
 * `<form action={...}>` is being processed it shows MUI's spinner and can't be
 * pressed twice. Use it instead of `<Button type="submit">` in server-action forms.
 */
export function SubmitButton({ disabled, loading, ...props }: Omit<ButtonProps, "type">) {
  const { pending } = useFormStatus();
  return <Button {...props} type="submit" loading={loading ?? pending} loadingPosition={props.startIcon ? "start" : "center"} disabled={disabled} />;
}
