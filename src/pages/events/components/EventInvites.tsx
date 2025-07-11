import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import {
  EventData,
  getEventInvites,
  respondToInvite,
} from "../../../services/calendarService";

type EventInvitesProps = {
  refreshFlag: number;
  setRefreshFlag: React.Dispatch<React.SetStateAction<number>>;
};

const EventInvites = ({ refreshFlag, setRefreshFlag }: EventInvitesProps) => {
  const { user } = useAuthContext();
  const userId = user!.id;
  const [events, setEvents] = useState<EventData[]>([]);

  const navigate = useNavigate();

  const fetchEvents = async () => {
    const events = await getEventInvites(userId);
    setEvents(events);
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshFlag]);

  const handleViewEvent = async (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleAcceptInvite = async (eventId: string) => {
    await respondToInvite(userId, eventId, "attending");
    await fetchEvents();
    setRefreshFlag((prev) => prev + 1);
  };

  const handleDeclineInvite = async (eventId: string) => {
    await respondToInvite(userId, eventId, "declined");
    await fetchEvents();
  };

  return (
    <div>
      <h2>Invites</h2>

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
                  <button onClick={(e) => handleAcceptInvite(id)}>
                    Accept
                  </button>
                  <button onClick={(e) => handleDeclineInvite(id)}>
                    Decline
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      ) : (
        <div className="box">No event invites</div>
      )}
    </div>
  );
};

export default EventInvites;
