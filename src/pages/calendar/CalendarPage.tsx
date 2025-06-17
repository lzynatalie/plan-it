import React, { useState, useEffect } from "react";
import Header from "../../components/header/Header";
import { useAuthContext } from "../../context/AuthContext";
import {
  UserEvent,
  UserEventData,
  addEvent,
  deleteEvent,
  getEvents,
} from "../../services/calendarService";
import { PostgrestError } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const CalendarPage = () => {
  const [eventData, setEventData] = useState<UserEventData[]>([]);
  const [newEvent, setNewEvent] = useState<UserEvent>({
    title: "",
    start_time: "",
    end_time: "",
  });
  // to track the event to be replaced, use null to track whether there is such an event
  const [updatedEvent, setUpdatedEvent] = useState<
    (UserEvent & { id: string }) | null
  >(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // user will not be undefined as the pages are only accessible by authenticated users
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const fetchEvents = async () => {
    const eventData = await getEvents(user!.id);
    setEventData(eventData);
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
      await addEvent(newEvent);
      await fetchEvents();
      // event added, set to clean slate for next event
      setNewEvent({
        title: "",
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

  const handleViewEvent = async (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      await fetchEvents();
    } catch (error) {
      if (error instanceof PostgrestError) {
        console.error("Failed to delete event:", error.message);
      }
    }
  };

  return (
    <div className="container">
      <Header />

      <div className="main">
        <h1>Calendar</h1>

        <div className="row">
          <div className="box column">
            {eventData.length ? (
              <ul>
                {eventData.map(({ id, title, start_time, end_time }) => (
                  <li key={id}>
                    <div className="row">
                      <div className="column">
                        <p>{title}</p>
                        <p>Start: {start_time}</p>
                        <p>End: {end_time}</p>
                      </div>

                      <button onClick={(e) => handleViewEvent(id)}>View</button>
                      <button onClick={(e) => handleDeleteEvent(id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              "No events yet"
            )}
          </div>

          <div className="box column">
            <div className="column">
              <form className="column" action="" onSubmit={handleAddEvent}>
                <input
                  type="text"
                  placeholder="Title"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  required
                />

                <input
                  type="datetime-local"
                  value={newEvent.start_time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, start_time: e.target.value })
                  }
                  required
                />

                <input
                  type="datetime-local"
                  value={newEvent.end_time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, end_time: e.target.value })
                  }
                  required
                />

                <div className="error">{error && <p>{error}</p>}</div>

                <button type="submit" disabled={loading}>
                  Add Event
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
