import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import {
  deleteEvent,
  deleteRecurringGroup,
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

    const grouped: Record<string, EventData> = {};

    for (const event of upcomingEvents) {
      const groupId = event.recurrence_group_id ?? event.id;
      if (!grouped[groupId]) {
        grouped[groupId] = event;
      } else {
        const existing = grouped[groupId];
        if (
          existing.start_time && 
          event.start_time &&
          new Date(event.start_time) < new Date(existing.start_time)
        ) {
          grouped[groupId] = event;
        }
      }
    }

    const sorted = Object.values(grouped).sort((a,b) =>
      new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime()
    );
    setEvents(sorted);
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshFlag]);

  const handleViewEvent = async (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    if (target.recurrence_group_id) {
      const confirmAll = window.confirm("This is a recurring event. Delete all occurrences?");
      if (confirmAll) {
        await deleteRecurringGroup(target.recurrence_group_id);
      } else {
        await deleteEvent(eventId);
      }
    } else {
      await deleteEvent(eventId);
    }
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
