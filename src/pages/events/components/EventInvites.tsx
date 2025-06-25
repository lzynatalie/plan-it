import React, { useState, useEffect } from "react";
import {
  EventData,
  getEventInvites,
  respondToInvite,
} from "../../../services/calendarService";
import { useAuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const EventInvites = () => {
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
  }, []);

  const handleViewEvent = async (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleAcceptInvite = async (eventId: string) => {
    await respondToInvite(userId, eventId, "attending");
    await fetchEvents();
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
