import React, { useEffect, useState } from "react";
import Header from "../../../components/header/Header";
import { useNavigate, useParams } from "react-router-dom";
import { getUserId } from "../../../services/friendService";
import { getSharedGroups, Group } from "../../../services/groupService";
import {
  deleteEvent,
  EventData,
  getSharedEvents,
} from "../../../services/calendarService";
import { useAuthContext } from "../../../context/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";

const UserPage = () => {
  const { user } = useAuthContext();
  const selfUserId = user!.id;
  const { username } = useParams();

  const [userId, setUserId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const events = await getSharedEvents([selfUserId, userId]);
      setEvents(events);
    } catch (error) {
      if (error instanceof PostgrestError) {
        setError(error.message);
      }
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!username) {
        setError("User not found.");
        return;
      }

      const userId = await getUserId(username);

      if (!userId) {
        setError("User not found.");
        return;
      }

      const groups = await getSharedGroups([selfUserId, userId]);
      setGroups(groups);

      const events = await getSharedEvents([selfUserId, userId]);
      setEvents(events);
    };

    fetchUser();
  }, []);

  const handleViewGroup = async (groupId: string) => {
    navigate(`/groups/${groupId}`);
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
        setError(error.message);
      }
    }
  };

  return (
    <div className="container">
      <Header />

      <div className="main">
        <h1>{username}</h1>

        <h2>Shared Groups</h2>

        {groups.length ? (
          <ul>
            {groups.map(({ id, name }) => (
              <li key={id}>
                <div className="box row">
                  <p>{name}</p>
                  <button onClick={(e) => handleViewGroup(id)}>View</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="box">No shared groups</div>
        )}

        <h2>Shared Events</h2>

        {events.length ? (
          <ul>
            {events.map(
              ({
                id,
                creator_id,
                title,
                description,
                start_time,
                end_time,
              }) => (
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
                    {selfUserId === creator_id && (
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
          <div className="box">No shared events</div>
        )}
      </div>
    </div>
  );
};

export default UserPage;
