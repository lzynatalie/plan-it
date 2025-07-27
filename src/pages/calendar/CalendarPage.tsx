import { PostgrestError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import {
  ConfirmedEvent,
  UserEvent,
  createEvent,
  getEvents,
  finaliseEvent,
  addPollOption
} from "../../services/calendarService";
import Calendar from "./components/Calendar";
import ImportNUSMods from "./components/ImportNUSMods";

const CalendarPage = () => {
  const { user } = useAuthContext();
  const userId = user!.id;
  const navigate = useNavigate();
  const location = useLocation();

  const [events, setEvents] = useState<ConfirmedEvent[]>([]);
  const [newEvent, setNewEvent] = useState<UserEvent>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    label: "",
  });
  const [importTimetable, setImportTimetable] = useState(false);
  const [addEvent, setAddEvent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [highlightRange, setHighlightRange] = useState<{
    start: string;
    end: string;
  }>();
  const [pendingMeta, setPendingMeta] = useState<{
    title: string; 
    description?: string; 
    eventId: string 
    recurrence?: "weekly" | "monthly" | "annually";
    repeat_until?: string;
    label?: "compulsory" | "flexible" | "optional";
  } | null>(null);
  const isFinalisingPendingEvent = !!pendingMeta?.eventId;

  useEffect(() => {
    const state = location.state as {
      highlightRange?: { start: string; end: string};
      autoOpenForm?: boolean;
      pendingEventData?: {
        title: string;
        description?: string;
        eventId: string;
      };
      pendingEventMeta?: {
        title: string;
        description?: string;
        eventId: string;
        recurrence?: "weekly" | "monthly" | "annually";
        repeat_until?: string;
        label?: "compulsory" | "flexible" | "optional";
      };
    };

    if (state?.highlightRange) {
      setHighlightRange(state.highlightRange);

      if (state.pendingEventMeta) {
        setPendingMeta(state.pendingEventMeta);
      }

      if (state.autoOpenForm && state.pendingEventData) {
        setNewEvent({
          title: state.pendingEventData?.title || "",
          description: state.pendingEventData?.description || "",
          start_time: state.highlightRange.start,
          end_time: state.highlightRange.end,
          recurrence: state.pendingEventMeta?.recurrence || undefined,
          repeat_until: state.pendingEventMeta?.repeat_until || undefined,
          label: state.pendingEventMeta?.label || "",
        });
        setAddEvent(true);
      }

      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (addEvent && pendingMeta && highlightRange) {
      setNewEvent((prev) => ({
        ...prev,
        title: pendingMeta.title || prev.title,
        description: pendingMeta.description || prev.description,
        recurrence: pendingMeta.recurrence || prev.recurrence,
        repeat_until: pendingMeta.repeat_until || prev.repeat_until,
        start_time: highlightRange.start,
        end_time: highlightRange.end,
        label: pendingMeta.label || prev.label,
      }));
    }
  }, [addEvent, pendingMeta, highlightRange]);

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const events = await getEvents(userId);
      const upcomingEvents = events.filter((event) => event.start_time);
      setEvents(upcomingEvents as ConfirmedEvent[]);
    } catch (error) {
      if (error instanceof PostgrestError) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // only fetch events and user info once, when the page first loads
  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const start = new Date(newEvent.start_time!);
    const end = new Date(newEvent.end_time!);

    if (end < start) {
      setLoading(false);
      setError("End time must be after start time!");
      return;
    }

    if (!newEvent.label) {
      setError("Please select a priority label.");
      setLoading(false);
      return;
    }
  
    try {
      const existingEvents = await getEvents(userId);
      
      //check for event clashes
      const conflictingEvent = existingEvents.find((event) => {

        return (
          event.start_time &&
          event.end_time &&
          new Date(newEvent.start_time!) < new Date(event.end_time) &&
          new Date(newEvent.end_time!) > new Date(event.start_time)
        );
      });
      
      if (conflictingEvent) {
        const formattedStart = new Date(conflictingEvent.start_time!).toLocaleString();
        const formattedEnd = new Date(conflictingEvent.end_time!).toLocaleString();
        setError(
          `Event clashes with "${conflictingEvent.title}" on ${formattedStart} - ${formattedEnd}`
        );
        setLoading(false);
        return;
      }

      if (pendingMeta?.eventId) {
        await finaliseEvent(userId, pendingMeta.eventId, {
          title: newEvent.title,
          description: newEvent.description,
          start_time: newEvent.start_time!,
          end_time: newEvent.end_time!,
        });
      } else {
        await createEvent(newEvent, userId);
      }

      await fetchEvents();
      setHighlightRange(undefined);
      // event added, set to clean slate for next event
      setNewEvent({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        label: "compulsory",
      });

      setAddEvent(false);
    } catch (error) {
      if (error instanceof PostgrestError) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateStr?: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
  };


  return (
    <div className="main">
      <div className="row">
        {!addEvent && (
          <button onClick={(e) => setAddEvent(true)}>Add event</button>
        )}

        {!importTimetable && (
          <button onClick={(e) => setImportTimetable(true)}>
            Import Timetable
          </button>
        )}
      </div>

      {addEvent && (
        <div className="box">
          <div className="column">
            <form className="column" action="" onSubmit={handleAddEvent}>
              <div className="input-group">
                <label htmlFor="title">Title</label>
                <input
                id="title"
                type="text"
                placeholder="e.g. Self-study session"
                value={newEvent.title}
                onChange={(e) =>
                setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
              </div>

              <div className="input-group">
                <label htmlFor="description">Description</label>
                <input
                id="description"
                type="text"
                placeholder="Optional: add more details"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              </div>

              <div className="input-group">
                <label htmlFor="start_time">Start Time</label>
                <input
                id="start_time"
                type="datetime-local"
                required
                value={newEvent.start_time|| ""}

                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, start_time: e.target.value }))
                }
              />
              </div>

              <div className="input-group">
                <label htmlFor="end_time">End Time</label>
                <input
                id="end_time"
                type="datetime-local"
                required
                value={newEvent.end_time|| ""}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, end_time: e.target.value }))
                }
              />
              </div>

              <div className="input-group">
                <label htmlFor="label">Priority</label>
                <select
                id="label"
                required
                value={newEvent.label || ""}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    label: e.target.value as "compulsory" | "flexible" | "optional",
                  }))
                }
                >
                  <option value="" disabled>Select event priority (required)</option>
                  <option value="compulsory">Compulsory event (Red)</option>
                  <option value="flexible">Flexible event, open to rescheduling (Yellow)</option>
                  <option value="optional">Optional event, open to skipping (Green)</option>
                </select>
                <small className="helper-text">
                  Select the event priority level to indicate how important this event is.
                </small>
              </div>

              <div className="input-group">
                <label htmlFor="recurrence">Repeat</label>
                <select
                id="recurrence"
                value={newEvent.recurrence || ""}
                disabled={isFinalisingPendingEvent}
                onChange={(e) => 
                  setNewEvent((prev) => ({
                    ...prev,
                    recurrence: e.target.value as "weekly" | "monthly" | "annually" | undefined,
                  }))
                }
                >
                  <option value="">
                    {isFinalisingPendingEvent && !(newEvent.recurrence || pendingMeta?.recurrence)
                      ? "This is a one-off event"
                      : "Choose event recurrence (optional)"}
                  </option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>   

              {newEvent.recurrence && (
                <div className="input-group">
                  <label htmlFor="repeat_until">Repeat Until</label>
                  <input
                  id="repeat_until"
                  type="date"
                  disabled={isFinalisingPendingEvent}
                  required
                  value={formatDateForInput(newEvent.repeat_until || pendingMeta?.repeat_until)}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, repeat_until: e.target.value }))
                  }
                  />
                </div>
              )}  

              {isFinalisingPendingEvent && (
                <p className="helper-text">
                  Recurrence is already set for this event and cannot be changed.
                </p>
              )}                

              <div className="error">{error && <p>{error}</p>}</div>

              <div className="row">
                {pendingMeta?.eventId && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await addPollOption(
                          pendingMeta.eventId,
                          newEvent.start_time + ":00",
                          newEvent.end_time +":00"
                        );

                        setSuccess("Poll option added successfully!");
                        setAddEvent(false);
                        navigate(`/events/${pendingMeta.eventId}`);
                      } catch (err) {
                        if (err instanceof Error) {
                          setError(err.message);
                        } else {
                          setError("Failed to add poll option.")
                        }
                      }
                    }}
                  >
                    Add as Poll Option
                  </button>
                )}

                <button onClick={(e) => setAddEvent(false)}>Close</button>

                <button type="submit" disabled={loading}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importTimetable && <ImportNUSMods functions={{ setImportTimetable, fetchEvents}} />}

      {!loading ? <Calendar events={events} highlightRange ={highlightRange} pendingMeta={pendingMeta} /> : <p>Loading...</p>}
    </div>
  );
};

export default CalendarPage;
