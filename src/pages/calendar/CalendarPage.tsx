import { PostgrestError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import {
  ConfirmedEvent,
  UserEvent,
  createEvent,
  deleteEvent,
  getEvents,
  finaliseEvent
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
  } | null>(null);

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
        });
        setAddEvent(true);
      }

      navigate(location.pathname, { replace: true});
    }
  }, [location.state, navigate]);

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
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
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
      });

      setAddEvent(false);

      setSuccess("Event created successfully!");
    } catch (error) {
      if (error instanceof PostgrestError) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
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
                value={newEvent.start_time || ""}
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
                value={newEvent.end_time || ""}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, end_time: e.target.value }))
                }
              />
              </div>    

              <div className="error">{error && <p>{error}</p>}</div>

              {success && (
                <div className="success">
                  <p>{success}</p>
                </div>
              )}

              <div className="row">
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
