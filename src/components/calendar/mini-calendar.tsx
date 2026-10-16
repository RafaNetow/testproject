"use client";

import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/en-gb";
import Box from "@mui/material/Box";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickerDay, type PickerDayProps } from "@mui/x-date-pickers/PickerDay";

type DayExtras = { busyDays?: Set<string>; todayKey?: string };

/** A day cell with a dot under it when something is on that day. */
function DotDay(props: PickerDayProps & DayExtras) {
  const { busyDays, todayKey, day, outsideCurrentMonth, ...rest } = props;
  const key = (day as Dayjs).format("YYYY-MM-DD");
  const busy = !outsideCurrentMonth && busyDays?.has(key);
  return (
    <Box sx={{ position: "relative" }}>
      <PickerDay
        {...rest}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        aria-current={key === todayKey ? "date" : undefined}
        sx={key === todayKey ? { fontWeight: 700, border: 1, borderColor: "primary.main" } : undefined}
      />
      {busy && (
        <Box
          aria-hidden
          sx={{ position: "absolute", left: "50%", bottom: 3, width: 4, height: 4, ml: "-2px", borderRadius: "50%", bgcolor: "primary.main", pointerEvents: "none" }}
        />
      )}
    </Box>
  );
}

/**
 * MUI's date picker calendar, used to jump around the big calendar. Weeks start
 * on Monday; days with events get a dot. "Today" is marked from the server's
 * notion of today so the server and browser render the same thing.
 */
export function MiniCalendar({
  value,
  today,
  busyDays,
  onChange,
}: {
  value: string;
  today: string;
  busyDays: Set<string>;
  onChange: (day: string) => void;
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <DateCalendar
        value={dayjs(value)}
        onChange={(d) => d && onChange((d as Dayjs).format("YYYY-MM-DD"))}
        disableHighlightToday
        showDaysOutsideCurrentMonth
        slots={{ day: DotDay as never }}
        slotProps={{ day: { busyDays, todayKey: today } as never }}
        sx={{ width: "100%", maxWidth: 320, height: "auto", m: 0, "& .MuiDayCalendar-slideTransition": { minHeight: 228 } }}
      />
    </LocalizationProvider>
  );
}
