import { PostgrestError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext, UserData } from "../../../context/AuthContext";
import {
  createEvent,
  deleteEvent,
  EventData,
  UserEvent,
  getEvents
} from "../../../services/calendarService";
import { getFriend, getFriendships } from "../../../services/friendService";
import {
  addMembers,
  deleteGroup,
  getGroup,
  getGroupEvents,
  getMembers,
  Group,
  removeMember,
} from "../../../services/groupService";

const GroupPage = () => {
  const { user, getProfile } = useAuthContext();
  const userId = user!.id;

  const [group, setGroup] = useState<Group>({
    id: "",
    creator_id: "",
    name: "",
  });
  const [members, setMembers] = useState<{ id: string; username: string }[]>(
    []
  );
  const [newMembers, setNewMembers] = useState<
    {
      friendshipId: string;
      friendId: string;
      username: string;
    }[]
  >([]);
  const [friends, setFriends] = useState<
    {
      friendshipId: string;
      friendId: string;
      username: string;
    }[]
  >([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [addNewMembers, setAddNewMembers] = useState(false);
  const [createNewEvent, setCreateNewEvent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { groupId } = useParams();
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const events = await getGroupEvents(group.id);
      setEvents(events);
    } catch (error) {
      if (error instanceof PostgrestError) {
        setError(error.message);
      }
    }
  };

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) {
        setError("Group not found.");
        return;
      }

      const group = await getGroup(groupId);
      setGroup(group);

      const members = await getMembers(groupId);
      setMembers(members);

      const events = await getGroupEvents(groupId);
      setEvents(events);
    };

    fetchGroup();
  }, []);

  const handleAddMembers = async () => {
    const newMemberIds = newMembers.map((member) => member.friendId);
    await addMembers(newMemberIds, group.id);
    setAddNewMembers(false);
    const members = await getMembers(group.id);
    setMembers(members);
  };

  const handleViewMember = async (username: string) => {
    navigate(`/users/${username}`);
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember(memberId, group.id);
    const members = await getMembers(group.id);
    setMembers(members);
    if (memberId === userId) {
      navigate("/groups");
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
        setError(error.message);
      }
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(group.id);
      navigate("/groups");
    } catch (error) {
      if (error instanceof PostgrestError) {
        setError(error.message);
      }
    }
  };

  return (
    <div className="main">
      <button onClick={(e) => navigate("/groups")}>Back</button>

      <h1>{group.name}</h1>

      <div className="row">
        <div className="box column">
          <h2>Members</h2>

          {!addNewMembers && group.creator_id === userId && (
            <button onClick={(e) => setAddNewMembers(true)}>Add Members</button>
          )}

          {addNewMembers && (
            <div className="box">
              {newMembers.length > 0 && (
                <div>
                  <h2>New Members</h2>
                  <ul>
                    {newMembers.map((member) => (
                      <li key={member.friendshipId}>
                        <div className="box row">
                          <div className="column">
                            <p>{member.username}</p>
                          </div>

                          <button
                            onClick={(e) => {
                              setNewMembers((prev) =>
                                prev.filter(
                                  (m) => m.friendshipId !== member.friendshipId
                                )
                              );
                              setFriends((prev) => [...prev, member]);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <AddMembers
                values={{ userId, members, friends }}
                functions={{
                  setNewMembers,
                  setFriends,
                  setError,
                  getProfile,
                }}
              />
              <button onClick={(e) => setAddNewMembers(false)}>Close</button>
              <button onClick={(e) => handleAddMembers()}>Save</button>
            </div>
          )}

          {members.length ? (
            <ul>
              {members.map(({ id, username }) => (
                <li key={id}>
                  <div className="box row">
                    <p>{username}</p>
                    {id !== userId && (
                      <button onClick={(e) => handleViewMember(username)}>
                        View
                      </button>
                    )}
                    {id !== userId && group.creator_id === userId && (
                      <button onClick={(e) => handleRemoveMember(id)}>
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="box">No members yet</div>
          )}
        </div>

        <div className="box column">
          <h2>Events</h2>

          <button onClick={(e) => setCreateNewEvent(true)}>Create Event</button>

          {createNewEvent && (
            <CreateEvent
              values={{ userId, groupId: group.id, members }}
              functions={{ setCreateNewEvent, fetchEvents, setSuccess }}
            />
          )}

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
            <div className="box">No events yet</div>
          )}
        </div>
      </div>

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

      {groupId &&
        (group.creator_id === userId ? (
          <button onClick={(e) => handleDeleteGroup()}>Delete Group</button>
        ) : (
          <button onClick={(e) => handleRemoveMember(userId)}>
            Leave Group
          </button>
        ))}
    </div>
  );
};

type AddMembersProps = {
  values: {
    userId: string;
    members: { id: string; username: string }[];
    friends: {
      friendshipId: string;
      friendId: string;
      username: string;
    }[];
  };
  functions: {
    setNewMembers: React.Dispatch<
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
    setError: React.Dispatch<React.SetStateAction<string>>;
    getProfile: (userId?: string) => Promise<UserData>;
  };
};

const AddMembers = ({
  values: { userId, members, friends },
  functions: { setNewMembers, setFriends, setError, getProfile },
}: AddMembersProps) => {
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendships = await getFriendships();
        const memberIds = members.map((member) => member.id);
        const friends = await Promise.all(
          friendships
            .filter(
              (friendship) => !memberIds.includes(getFriend(userId, friendship))
            )
            .map(async (friendship) => {
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
                    setNewMembers((prev) => [...prev, friend]);
                    setFriends((prev) =>
                      prev.filter((f) => f.friendshipId !== friend.friendshipId)
                    );
                  }}
                >
                  Add
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

type CreateEventProps = {
  values: {
    userId: string;
    groupId: string;
    members: {
      id: string;
      username: string;
    }[];
  };
  functions: {
    setCreateNewEvent: React.Dispatch<React.SetStateAction<boolean>>;
    fetchEvents: () => Promise<void>;
    setSuccess: React.Dispatch<React.SetStateAction<string>>;
  };
};

const CreateEvent = ({
  values: { userId, groupId, members },
  functions: { setCreateNewEvent, fetchEvents, setSuccess },
}: CreateEventProps) => {
  const [newEvent, setNewEvent] = useState<UserEvent>({
    title: "",
    description: "",
    start_time: null,
    end_time: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const memberIds = members
    .filter((member) => member.id !== userId)
    .map((member) => member.id);

     if (newEvent.start_time && newEvent.end_time) {
          const start = new Date(newEvent.start_time);
          const end = new Date(newEvent.end_time);
          if (end < start) {
            setLoading(false);
            setError("End time must be after start time!");
            return;
          }
    
          try {
            const memberIdToUsername = Object.fromEntries(members.map(m => [m.id, m.username]));
            
            const allMemberEvents = (
              await Promise.all(memberIds.map(async (id) => {
                const events = await getEvents(id);
                return events.map(e => ({ ...e, ownerId: id }));
              }))
            ).flat();
    
            const conflictingEvent = allMemberEvents.find((event) => {
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
              const ownerUsername = memberIdToUsername[conflictingEvent.ownerId] || "a member";

              setError(
                `Clashes with ${ownerUsername}'s "${conflictingEvent.title}" (${formattedStart} - ${formattedEnd})`
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
      await createEvent(newEvent, userId, memberIds, groupId);
      setNewEvent({
        title: "",
        description: "",
        start_time: null,
        end_time: null,
      });
      await fetchEvents();
      setSuccess("Event created successfully!");
    } catch (error) {
      if (error instanceof PostgrestError) {
        setError(error.message);
      }
    } finally {
      setCreateNewEvent(false);
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

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        <div className="row">
          <button onClick={(e) => setCreateNewEvent(false)}>Cancel</button>
          <button type="submit" disabled={loading}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupPage;
