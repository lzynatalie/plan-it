import {
  CalendarEventExternal,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import { createEventModalPlugin } from "@schedule-x/event-modal";
import { ScheduleXCalendar, useCalendarApp } from "@schedule-x/react";
import { createResizePlugin } from "@schedule-x/resize";
import "@schedule-x/theme-default/dist/calendar.css";
import { updateEvent } from "../../../services/calendarService";
import { useNavigate } from "react-router-dom";

type CalendarProps = {
  events: { id: string; title: string; start_time: string; end_time: string }[];
};

const Calendar = ({ events }: CalendarProps) => {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const toScheduleXFormat = (isoString: string) => {
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1); // getMonth is 0-indexed
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const formattedEvents = events.map(({ id, title, start_time, end_time }) => ({
    id,
    title,
    start: toScheduleXFormat(start_time),
    end: toScheduleXFormat(end_time),
  }));

  const navigate = useNavigate();

  const calendar = useCalendarApp({
    views: [createViewWeek(), createViewMonthGrid()],
    events: formattedEvents,
    isDark: true,
    // plugins: [
    //   createEventModalPlugin(),
    //   createDragAndDropPlugin(),
    //   createResizePlugin(),
    // ],
    callbacks: {
      //   async onEventUpdate(updatedEvent: CalendarEventExternal) {
      //     await updateEvent(updatedEvent.id as string, {
      //       title: updatedEvent.title,
      //       description: updatedEvent.description,
      //       start_time: updatedEvent.start,
      //       end_time: updatedEvent.end,
      //     });
      //   },
      onEventClick(calendarEvent: CalendarEventExternal, e: UIEvent) {
        navigate(`/events/${calendarEvent.id}`);
      },
    },
  });

  return (
    <div>
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
};

export default Calendar;
