import React, { useState, useEffect } from "react";
import {
  deleteEvent,
  EventData,
  getEvents,
} from "../../../services/calendarService";
import { useAuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const PendingEvents = () => {
  const { user } = useAuthContext();
  const userId = user!.id;
  const [events, setEvents] = useState<EventData[]>([]);

  const navigate = useNavigate();

  const fetchEvents = async () => {
    const events = await getEvents(userId);
    const upcomingEvents = events.filter((event) => !event.start_time);
    setEvents(upcomingEvents);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleViewEvent = async (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
    await fetchEvents();
  };

  return (
    <div>
      <h2>Pending Events</h2>

      {events.length > 0 ? (
        <ul>
          {events.map(
            ({ id, creator_id, title, description, start_time, end_time }) => (
              <li key={id}>
                <div className="box row">
                  <div className="column">
                    <p>{title}</p>
                    {description && <p>{description}</p>}
                  </div>

                  <button onClick={(e) => handleViewEvent(id)}>View</button>
                  {userId === creator_id && (
                    <button onClick={(e) => handleDeleteEvent(id)}>
                      Delete
                    </button>
                  )}
                </div>
              </li>
            )
          )}
        </ul>
      ) : (
        <div className="box">No pending events</div>
      )}
    </div>
  );
};

export default PendingEvents;
