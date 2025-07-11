import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import {
  deleteEvent,
  EventData,
  getEvents,
} from "../../../services/calendarService";

type UpcomingEventsProps = {
  refreshFlag?: number;
};

const UpcomingEvents = ({ refreshFlag }: UpcomingEventsProps) => {
  const { user } = useAuthContext();
  const userId = user!.id;
  const [events, setEvents] = useState<EventData[]>([]);

  const navigate = useNavigate();

  const fetchEvents = async () => {
    const events = await getEvents(userId);
    const upcomingEvents = events.filter(
      (event) => event.start_time && new Date(event.start_time) > new Date()
    );
    setEvents(upcomingEvents);
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshFlag]);

  const handleViewEvent = async (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
    await fetchEvents();
  };

  return (
    <div className="column">
      <h2>Upcoming Events</h2>

      {events.length > 0 ? (
        <ul>
          {events.map(
            ({ id, creator_id, title, description, start_time, end_time }) => (
              <li key={id}>
                <div className="box row">
                  <div className="column">
                    <p>{title}</p>
                    {description && <p>{description}</p>}
                    {start_time && (
                      <p>Start: {new Date(start_time).toLocaleString()}</p>
                    )}
                    {end_time && (
                      <p>End: {new Date(end_time).toLocaleString()}</p>
                    )}
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
        <div className="box">No upcoming events</div>
      )}
    </div>
  );
};

export default UpcomingEvents;
