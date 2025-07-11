import { PostgrestError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useAuthContext, UserData } from "../../context/AuthContext";
import { createEvent, getEvents, UserEvent } from "../../services/calendarService";
import { getFriend, getFriendships } from "../../services/friendService";
import EventInvites from "./components/EventInvites";
import PendingEvents from "./components/PendingEvents";
import UpcomingEvents from "./components/UpcomingEvents";

const EventsPage = () => {
  const [createEvent, setCreateEvent] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  return (
    <div className="main">
      <h1>Events</h1>

      {createEvent && <CreateEvent functions={{ setCreateEvent, setRefreshFlag }} />}

      {!createEvent && (
        <button onClick={(e) => setCreateEvent(true)}>Create Event</button>
      )}

      <EventInvites refreshFlag ={refreshFlag} setRefreshFlag={setRefreshFlag} />

      <div className="row">
        <PendingEvents refreshFlag={refreshFlag} />
        <UpcomingEvents refreshFlag={refreshFlag} />
      </div>
    </div>
  );
};

type CreateEventProps = {
  functions: {
    setCreateEvent: React.Dispatch<React.SetStateAction<boolean>>;
    setRefreshFlag: React.Dispatch<React.SetStateAction<number>>;
  };
};

const CreateEvent = ({ functions: { setCreateEvent, setRefreshFlag } }: CreateEventProps) => {
  const { user, getProfile } = useAuthContext();
  const userId = user!.id;

  const [newEvent, setNewEvent] = useState<UserEvent>({
    title: "",
    description: "",
    start_time: null,
    end_time: null,
  });
  const [invitees, setInvitees] = useState<
    { friendshipId: string; friendId: string; username: string }[]
  >([]);
  const [friends, setFriends] = useState<
    { friendshipId: string; friendId: string; username: string }[]
  >([]);
  const [inviteFriends, setInviteFriends] = useState(false);
  const [error, setError] = useState("");
  const[success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);


  const handleCreateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (newEvent.start_time && newEvent.end_time) {
      const start = new Date(newEvent.start_time);
      const end = new Date(newEvent.end_time);
      if (end < start) {
        setLoading(false);
        setError("End time must be after start time!");
        return;
      }

      try {
        const existingEvents = await getEvents(userId);

        const conflictingEvent = existingEvents.find((event) => {
          return (
            event.start_time &&
            event.end_time &&
            new Date(newEvent.start_time!) < new Date(event.end_time) &&
            new Date(newEvent.end_time!) > new Date(event.start_time)
          );
        });
        
        if (conflictingEvent) {
          const formattedStart = new Date(conflictingEvent.start_time!).toLocaleString();
          const formattedEnd = new Date(conflictingEvent.end_time!).toLocaleString();
          setError(
            `Event clashes with "${conflictingEvent.title}" on ${formattedStart} - ${formattedEnd}`
          );
          setLoading(false);
          return;
        }
      } catch (error) {
        if (error instanceof PostgrestError) {
          setError("Failed to check for clashes: " + error.message);
          setLoading(false);
          return;
        }
      }
    }

    try {
      const inviteeIds = invitees.map((invitee) => invitee.friendId);
      await createEvent(newEvent, userId, inviteeIds);

      setNewEvent({
        title: "",
        description: "",
        start_time: null,
        end_time: null,
      });
      setInvitees([]);
      setInviteFriends(false);
      setSuccess("Event created successfully!")
      setCreateEvent(false);
      setRefreshFlag((prev) => prev + 1);
    } catch (error) {
      if (error instanceof PostgrestError) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="box">
      <form className="column" action="" onSubmit={handleCreateEvent}>
        <div className="input-group">
          <label htmlFor="title">Title</label>
          <input
          id="title"
          type="text"
          placeholder="e.g. Project meeting"
          value={newEvent.title}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />
        </div>

        <div className="input-group">
          <label htmlFor="description">Description</label>
          <input
          id="description"
          type="text"
          placeholder="Optional: add more details"
          value={newEvent.description}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, description: e.target.value }))
          }
        />
        </div>

        <div className="input-group">
          <label htmlFor="start_time">Start Time</label>
          <input
          id="start_time"
          type="datetime-local"
          value={newEvent.start_time || ""}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, start_time: e.target.value }))
          }
        />
        <small className="helper-text">
          Leave empty to let Plan-It! suggest a timing!
        </small>
        </div>

        <div className="input-group">
          <label htmlFor="end_time">End Time</label>
          <input
          id="end_time"
          type="datetime-local"
          value={newEvent.end_time || ""}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, end_time: e.target.value }))
          }
        />
        <small className="helper-text">
          Leave empty to let Plan-It! suggest a timing!
        </small>
        </div>    

        <ul>
          <h2>Invite List</h2>
          {invitees.map((invitee) => (
            <li key={invitee.friendshipId}>
              <div className="box row">
                <div className="column">
                  <p>{invitee.username}</p>
                </div>

                <button
                  onClick={(e) => {
                    setInvitees((prev) =>
                      prev.filter(
                        (i) => i.friendshipId !== invitee.friendshipId
                      )
                    );
                    setFriends((prev) => [...prev, invitee]);
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        {inviteFriends && (
          <InviteFriends
            values={{ userId, friends }}
            functions={{
              setInvitees,
              setFriends,
              setInviteFriends,
              setError,
              getProfile,
            }}
          />
        )}

        {!inviteFriends && (
          <button onClick={(e) => setInviteFriends(true)}>
            Invite Friends
          </button>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="success">
            <p>{success}</p>
          </div>
        )}

        <div className="row">
          <button onClick={(e) => setCreateEvent(false)}>Cancel</button>
          <button type="submit" disabled={loading}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

type InviteFriendsProps = {
  values: {
    userId: string;
    friends: {
      friendshipId: string;
      friendId: string;
      username: string;
    }[];
  };
  functions: {
    setInvitees: React.Dispatch<
      React.SetStateAction<
        {
          friendshipId: string;
          friendId: string;
          username: string;
        }[]
      >
    >;
    setFriends: React.Dispatch<
      React.SetStateAction<
        {
          friendshipId: string;
          friendId: string;
          username: string;
        }[]
      >
    >;
    setInviteFriends: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string>>;
    getProfile: (userId?: string) => Promise<UserData>;
  };
};

const InviteFriends = ({
  values: { userId, friends },
  functions: {
    setInvitees,
    setFriends,
    setInviteFriends,
    setError,
    getProfile,
  },
}: InviteFriendsProps) => {
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendships = await getFriendships();
        const friends = await Promise.all(
          friendships.map(async (friendship) => {
            const friendId = getFriend(userId, friendship);
            const profile = await getProfile(friendId);
            return {
              friendshipId: friendship.id,
              friendId: getFriend(userId, friendship),
              username: profile.username,
            };
          })
        );

        setFriends(friends);
      } catch (error) {
        if (error instanceof PostgrestError) {
          setError(error.message);
        }
      }
    };

    fetchFriends();
  }, []);

  return (
    <div>
      {friends.length > 0 && (
        <ul>
          <h2>Friends</h2>

          {friends.map((friend) => (
            <li key={friend.friendshipId}>
              <div className="box row">
                <div className="column">
                  <p>{friend.username}</p>
                </div>

                <button
                  onClick={(e) => {
                    setInvitees((prev) => [...prev, friend]);
                    setFriends((prev) =>
                      prev.filter((f) => f.friendshipId !== friend.friendshipId)
                    );
                  }}
                >
                  Invite
                </button>
              </div>
            </li>
          ))}

          <button onClick={(e) => setInviteFriends(false)}>Close</button>
        </ul>
      )}
    </div>
  );
};

export default EventsPage;
