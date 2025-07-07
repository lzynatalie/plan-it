import { PostgrestError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import {
  ConfirmedEvent,
  UserEvent,
  createEvent,
  deleteEvent,
  getEvents,
} from "../../services/calendarService";
import Calendar from "./components/Calendar";
import ImportNUSMods from "./components/ImportNUSMods";

const CalendarPage = () => {
  const { user } = useAuthContext();
  const userId = user!.id;

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

    try {
      await createEvent(newEvent, userId);
      await fetchEvents();
      // event added, set to clean slate for next event
      setNewEvent({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
      });
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
              <input
                type="text"
                placeholder="Title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />

              <input
                type="text"
                placeholder="Description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />

              <input
                type="datetime-local"
                value={newEvent.start_time || ""}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
                required
              />

              <input
                type="datetime-local"
                value={newEvent.end_time || ""}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...newEvent,
                    end_time: e.target.value,
                  }))
                }
                required
              />

              <div className="error">{error && <p>{error}</p>}</div>

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

      {!loading ? <Calendar events={events} /> : <p>Loading...</p>}
    </div>
  );
};

export default CalendarPage;
