import {
  CalendarEventExternal,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import { createEventModalPlugin } from "@schedule-x/event-modal";
import { createEventRecurrencePlugin } from "@schedule-x/event-recurrence";
import { ScheduleXCalendar, useCalendarApp } from "@schedule-x/react";
import { createResizePlugin } from "@schedule-x/resize";
import "@schedule-x/theme-default/dist/calendar.css";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { updateEvent } from "../../../services/calendarService";

type CalendarProps = {
  events: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    recurrence: string | null;
    repeat_until: string | null;
  }[];
  highlightRange?: { start: string; end: string };
  pendingMeta?: { title: string; description?: string; eventId: string } | null;
};

const Calendar = ({ events, highlightRange, pendingMeta }: CalendarProps) => {
  const toScheduleXFormat = (isoString: string) => {
    if (!isoString) return "";

    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const toDate = (isoString: string) => {
    const date = new Date(isoString);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());

    return `${yyyy}${mm}${dd}`;
  };

  const toRRule = (recurrence: string | null, repeat_until: string | null) => {
    if (!recurrence || !repeat_until) {
      return `FREQ=DAILY;COUNT=1`;
    }

    const freq =
      recurrence === "annually" ? "YEARLY" : recurrence.toUpperCase();

    const until = toDate(repeat_until);

    return `FREQ=${freq};UNTIL=${until}`;
  };

  const formattedEvents = [
    ...events
      .filter(({ start_time, end_time }) => start_time && end_time)
      .map(({ id, title, start_time, end_time, recurrence, repeat_until }) => ({
        id,
        title,
        start: toScheduleXFormat(start_time),
        end: toScheduleXFormat(end_time),
        rrule: toRRule(recurrence, repeat_until),
      })),
    ...(highlightRange
      ? [
          {
            id: "highlight",
            title: "Suggested Time",
            start: toScheduleXFormat(highlightRange.start),
            end: toScheduleXFormat(highlightRange.end),
            background: true,
          },
        ]
      : []),
  ];

  const navigate = useNavigate();

  const calendar = useCalendarApp({
    views: [createViewWeek(), createViewMonthGrid()],
    events: formattedEvents,
    isDark: true,
    plugins: [
      // createEventModalPlugin(),
      // createDragAndDropPlugin(),
      // createResizePlugin(),
      createEventRecurrencePlugin(),
    ],
    callbacks: {
      // async onEventUpdate(updatedEvent: CalendarEventExternal) {
      //   await updateEvent(updatedEvent.id as string, {
      //     title: updatedEvent.title,
      //     description: updatedEvent.description,
      //     start_time: updatedEvent.start,
      //     end_time: updatedEvent.end,
      //   });
      // },
      onEventClick(calendarEvent: CalendarEventExternal, e: UIEvent) {
        if (calendarEvent.id === "highlight") {
          // open the event form pre-filled
          navigate("/calendar", {
            state: {
              highlightRange: {
                start: calendarEvent.start,
                end: calendarEvent.end,
              },
              autoOpenForm: true,
              pendingEventData: {
                title: pendingMeta?.title || "",
                description: pendingMeta?.description || "",
                eventId: pendingMeta?.eventId || "",
              },
            },
          });
          return;
        }

        navigate(`/events/${calendarEvent.id}`);
      },
    },
  });

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlightRange?.start) return;

    const timeout = setTimeout(() => {
      const highlightedEl = document.querySelector(
        '[data-event-id="highlight"]'
      );
      if (highlightedEl instanceof HTMLElement) {
        highlightedEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [highlightRange]);

  return (
    <div ref={calendarRef}>
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
};

export default Calendar;
