import React, { useEffect, useState } from "react";
import Header from "../../components/header/Header";
import { addEvent, UserEvent } from "../../services/calendarService";
import { getFriend, getFriendships } from "../../services/friendService";
import { PostgrestError } from "@supabase/supabase-js";
import { createGroup } from "../../services/groupService";
import { useAuthContext } from "../../context/AuthContext";

const EventsPage = () => {
  const [createEvent, setCreateEvent] = useState(false);

  return (
    <div className="container">
      <Header />

      <div className="main">
        <h1>Events</h1>

        {createEvent && <CreateEvent functions={{ setCreateEvent }} />}

        {!createEvent && (
          <button onClick={(e) => setCreateEvent(true)}>Create Event</button>
        )}

        <div className="row">
          <div className="column">
            <h2>Pending</h2>
            <div className="box">No pending events</div>
          </div>
          <div className="column">
            <h2>Upcoming</h2>
            <div className="box">No upcoming events</div>
          </div>
        </div>
      </div>
    </div>
  );
};

type CreateEventProps = {
  functions: {
    setCreateEvent: React.Dispatch<React.SetStateAction<boolean>>;
  };
};

const CreateEvent = ({ functions: { setCreateEvent } }: CreateEventProps) => {
  const { user } = useAuthContext();
  const userId = user!.id;

  const [newEvent, setNewEvent] = useState<UserEvent>({
    title: "",
    description: "",
  });
  const [invitees, setInvitees] = useState<
    { friendshipId: string; friendId: string }[]
  >([]);
  const [friends, setFriends] = useState<
    { friendshipId: string; friendId: string }[]
  >([]);
  const [inviteFriends, setInviteFriends] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const inviteeIds = invitees.map((i) => i.friendId);
      const groupId = await createGroup(
        [...inviteeIds, userId],
        newEvent.title
      );
      await addEvent({ ...newEvent, group_id: groupId });
      setNewEvent({
        title: "",
        description: "",
      });
      setInvitees([]);
      setInviteFriends(false);
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
        <input
          type="text"
          placeholder="Title"
          value={newEvent.title}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />

        <input
          type="text"
          placeholder="Description"
          value={newEvent.description}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, description: e.target.value }))
          }
        />

        <input
          type="datetime-local"
          value={newEvent.start_time}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, start_time: e.target.value }))
          }
        />

        <input
          type="datetime-local"
          value={newEvent.end_time}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, end_time: e.target.value }))
          }
        />

        <ul>
          <h2>Invite List</h2>
          {invitees.map((invitee) => (
            <li key={invitee.friendshipId}>
              <div className="box row">
                <div className="column">
                  <p>{invitee.friendId}</p>
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
            functions={{ setInvitees, setFriends, setInviteFriends, setError }}
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
    }[];
  };
  functions: {
    setInvitees: React.Dispatch<
      React.SetStateAction<
        {
          friendshipId: string;
          friendId: string;
        }[]
      >
    >;
    setFriends: React.Dispatch<
      React.SetStateAction<
        {
          friendshipId: string;
          friendId: string;
        }[]
      >
    >;
    setInviteFriends: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string>>;
  };
};

const InviteFriends = ({
  values: { userId, friends },
  functions: { setInvitees, setFriends, setInviteFriends, setError },
}: InviteFriendsProps) => {
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendships = await getFriendships();
        const friends = friendships.map((friendship) => ({
          friendshipId: friendship.id,
          friendId: getFriend(userId, friendship),
        }));
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
                  <p>{friend.friendId}</p>
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
