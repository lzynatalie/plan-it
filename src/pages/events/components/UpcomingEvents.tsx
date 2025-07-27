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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventData | null>(null);

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

    const sorted = Object.values(grouped).sort(
      (a, b) =>
        new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime()
    );
    setEvents(sorted);
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshFlag]);

  const handleViewEvent = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleDeleteEvent = async (event: EventData) => {
    if (event.recurrence_group_id) {
      const confirmed = window.confirm(
        "This is a recurring event.\n\nOnly this occurrence will be deleted.\n\nTo delete the entire series, open the event and delete from there.\n\nProceed with deleting this one?"
      );
      if (!confirmed) return;

      await deleteEvent(event.id);
    } else {
      const confirmed = window.confirm("Are you sure you want to delete this event?");
      if (!confirmed) return;

      await deleteEvent(event.id);
    }

    await fetchEvents();
  };


  return (
    <>
      <div className="column">
        <h2>Upcoming Events</h2>

        {events.length > 0 ? (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <div className="box row">
                  <div className="column">
                    <p>{event.title}</p>
                    {event.description && <p>{event.description}</p>}
                    {event.start_time && (
                      <p>Start: {new Date(event.start_time).toLocaleString()}</p>
                    )}
                    {event.end_time && (
                      <p>End: {new Date(event.end_time).toLocaleString()}</p>
                    )}
                  </div>

                  <button onClick={() => handleViewEvent(event.id)}>View</button>
                  {userId === event.creator_id && (
                    <button onClick={() => handleDeleteEvent(event)}>
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="box">No upcoming events</div>
        )}
      </div>
    </>
  );
};

export default UpcomingEvents;
