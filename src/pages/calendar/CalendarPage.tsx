import React, { useState, useEffect } from "react";
import Header from "../../components/header/Header";
import {
  UserEvent,
  EventData,
  addEvent,
  deleteEvent,
  getEvents,
} from "../../services/calendarService";
import { PostgrestError } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const CalendarPage = () => {
  const [eventData, setEventData] = useState<EventData[]>([]);
  const [newEvent, setNewEvent] = useState<UserEvent>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchEvents = async () => {
    const eventData = await getEvents();
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
          <Calendar
            values={{ eventData }}
            functions={{ handleViewEvent, handleDeleteEvent }}
          />

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
                  type="text"
                  placeholder="Description"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
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

type CalendarProps = {
  values: {
    eventData: EventData[];
  };
  functions: {
    handleViewEvent: (eventId: string) => Promise<void>;
    handleDeleteEvent: (eventId: string) => Promise<void>;
  };
};

const Calendar = ({
  values: { eventData },
  functions: { handleViewEvent, handleDeleteEvent },
}: CalendarProps) => {
  return (
    <div className="box column">
      {eventData.length ? (
        <ul>
          {eventData.map(({ id, title, description, start_time, end_time }) => (
            <li key={id}>
              <div className="box row">
                <div className="column">
                  <p>{title}</p>
                  {description && <p>{description}</p>}
                  <p>Start: {start_time}</p>
                  <p>End: {end_time}</p>
                </div>

                <button onClick={(e) => handleViewEvent(id)}>View</button>
                <button onClick={(e) => handleDeleteEvent(id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        "No events yet"
      )}
    </div>
  );
};

export default CalendarPage;
