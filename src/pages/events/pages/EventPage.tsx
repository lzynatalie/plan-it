import { PostgrestError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import {
  EventData,
  UserEvent,
  deleteEvent,
  getAttendees,
  getEvent,
  getTimings,
  removeUser,
  respondToInvite,
  updateEvent,
  getEvents
} from "../../../services/calendarService";

const EventPage = () => {
  const { user } = useAuthContext();
  const userId = user!.id;

  const [currentEvent, setCurrentEvent] = useState<EventData>({
    id: "",
    creator_id: "",
    group_id: "",
    title: "Event",
    description: "",
    start_time: "",
    end_time: "",
  });
  const [attendees, setAttendees] = useState<
    { id: string; username: string }[]
  >([]);
  const [timings, setTimings] = useState<{ start: string; end: string }[]>([]);
  const [updateEvent, setUpdateEvent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { eventId } = useParams();
  const navigate = useNavigate();

  const fetchAttendees = async () => {
    const attendees = await getAttendees(currentEvent.id);
    setAttendees(attendees);
  };

  const fetchTimings = async () => {
    const timings = await getTimings(currentEvent.id);

    setTimings(timings);
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setError("Event not found.");
        return;
      }

      const event = await getEvent(eventId);
      setCurrentEvent(event);

      const attendees = await getAttendees(eventId);
      setAttendees(attendees);

      const timings = await getTimings(eventId);
      setTimings(timings);
    };

    fetchEventDetails();
  }, []);

  const handleJoinEvent = async () => {
    await respondToInvite(userId, currentEvent.id, "attending");
    await fetchAttendees();
    await fetchTimings();
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      navigate("/events");
    } catch (error) {
      if (error instanceof PostgrestError) {
        console.error("Failed to delete event:", error.message);
      }
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    try {
      await removeUser(eventId, userId);
      navigate("/events");
    } catch (error) {
      if (error instanceof PostgrestError) {
        console.error("Failed to remove user from event:", error.message);
      }
    }
  };

  return (
    <div className="main">
      <h1>{currentEvent.title}</h1>

      <div className="box">
        <h2>Event Details</h2>

        {currentEvent.description && (
          <p>Description: {currentEvent.description}</p>
        )}
        {currentEvent.start_time ? (
          <p>
            Start time: {new Date(currentEvent.start_time).toLocaleString()}
          </p>
        ) : (
          "Timing not decided yet"
        )}
        {currentEvent.end_time && (
          <p>End time: {new Date(currentEvent.end_time).toLocaleString()}</p>
        )}

        {attendees.length > 0 && (
          <div>
            <h2>Attendee List</h2>
            <ul>
              {attendees.map(({ id, username }) => (
                <li key={id}>
                  <p>{username}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!currentEvent.start_time && userId === currentEvent.creator_id && (
          <div>
            <h2>Available Timings</h2>
            {timings.length > 0 ? (
              <ol>
                {timings.map(({ start, end }, index) => (
                  <li key={index}>
                    <button
                      onClick={() => {
                         navigate("/calendar", {
                          state: {
                            highlightRange: {
                              start: new Date(start).toISOString(),
                              end: new Date(end).toISOString(),
                            },
                            pendingEventMeta: {
                              title: currentEvent.title,
                              description: currentEvent.description,
                              eventId: currentEvent.id,
                            },
                          },
                        });
                      }}
                    >
                      {new Date(start).toLocaleString()} - {new Date(end).toLocaleString()}
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              "No available timings"
            )}
          </div>
        )}

        {!currentEvent.start_time && userId !== currentEvent.creator_id && (
          <p className="finalise-message">
            Waiting for the event creator to finalise the timing.
            </p>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}
      </div>

      {!attendees.map((attendee) => attendee.id).includes(userId) && (
        <button onClick={(e) => handleJoinEvent()}>Join Event</button>
      )}

      {!updateEvent &&
        (userId === currentEvent.creator_id ? (
          <div className="row">
            <button
              onClick={(e) => {
                setUpdateEvent(true);
              }}
            >
              Update
            </button>
            <button
              onClick={(e) => {
                handleDeleteEvent(currentEvent.id);
              }}
            >
              Delete
            </button>
          </div>
        ) : (
          <button onClick={(e) => handleLeaveEvent(currentEvent.id)}>
            Leave
          </button>
        ))}

      {updateEvent && (
        <UpdateEvent
          values={{ currentEvent }}
          functions={{ setUpdateEvent, setCurrentEvent, setSuccess }}
        />
      )}

      {success && (
        <div className="success">
          <p>{success}</p>
        </div>
      )}
    </div>
  );
};

type UpdateEventProps = {
  values: {
    currentEvent: EventData;
  };
  functions: {
    setUpdateEvent: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentEvent: React.Dispatch<React.SetStateAction<EventData>>;
    setSuccess: React.Dispatch<React.SetStateAction<string>>;
  };
};

const UpdateEvent = ({
  values: { currentEvent },
  functions: { setUpdateEvent, setCurrentEvent, setSuccess },
}: UpdateEventProps) => {
  const [updatedEvent, setUpdatedEvent] = useState<UserEvent>({
    title: currentEvent.title,
    description: currentEvent.description,
    start_time: currentEvent.start_time,
    end_time: currentEvent.end_time,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (updatedEvent.start_time && updatedEvent.end_time!) {
        const start = new Date(updatedEvent.start_time);
        const end = new Date(updatedEvent.end_time);
        if (end < start) {
          setError("End time must be after start time!");
          setLoading(false);
          return;
        }

        const attendees = await getAttendees(currentEvent.id);
        const attendeeMap = Object.fromEntries(
          attendees.map((a) => [a.id, a.username])
        );

        const allEvents = (
          await Promise.all(
            attendees.map(async ({ id }) => {
              const userEvents = await getEvents(id);
              return userEvents
              .filter((e) => e.id !== currentEvent.id)
              .map((e) => ({ ...e, ownerId: id }));
            })
          )
        ).flat();  

        const conflicting = allEvents.find((e) => {
          return (
            e.start_time &&
            e.end_time &&
            new Date(updatedEvent.start_time!) < new Date(e.end_time) &&
            new Date(updatedEvent.end_time!) > new Date(e.start_time)
          );
        });


        if (conflicting) {
          const formattedStart = new Date(conflicting.start_time!).toLocaleString();
          const formattedEnd = new Date(conflicting.end_time!).toLocaleString();
          const username = attendeeMap[conflicting.ownerId] || "a member";
          
          setError(
            `Updated event clashes with ${username}'s "${conflicting.title}" (${formattedStart} - ${formattedEnd})`
          );
          setLoading(false);
          return;
        }
      }

      await updateEvent(currentEvent.id, updatedEvent);
      setCurrentEvent({
        ...updatedEvent,
        id: currentEvent.id,
        creator_id: currentEvent.creator_id,
        group_id: currentEvent.group_id,
      });
      setSuccess("Event updated successfully!");
    } catch (error) {
      if (error instanceof PostgrestError) {
        setError(error.message);
      }
    } finally {
      setUpdateEvent(false);
      setLoading(false);
    }
  };

  return (
    <div className="box">
      <form className="column" action="" onSubmit={handleUpdateEvent}>
                <div className="input-group">
          <label htmlFor="title">Title</label>
          <input
          id="title"
          type="text"
          placeholder="e.g. Project meeting"
          value={updatedEvent.title}
          onChange={(e) =>
            setUpdatedEvent((prev) => ({ ...prev, title: e.target.value }))
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
          value={updatedEvent.description}
          onChange={(e) =>
            setUpdatedEvent((prev) => ({ ...prev, description: e.target.value }))
          }
        />
        </div>

        <div className="input-group">
          <label htmlFor="start_time">Start Time</label>
          <input
          id="start_time"
          type="datetime-local"
          value={updatedEvent.start_time || ""}
          onChange={(e) =>
            setUpdatedEvent((prev) => ({ ...prev, start_time: e.target.value }))
          }
        />
        </div>

        <div className="input-group">
          <label htmlFor="end_time">End Time</label>
          <input
          id="end_time"
          type="datetime-local"
          value={updatedEvent.end_time || ""}
          onChange={(e) =>
            setUpdatedEvent((prev) => ({ ...prev, end_time: e.target.value }))
          }
        />
        </div>    

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        <div className="row">
          <button onClick={(e) => setUpdateEvent(false)}>Cancel</button>
          <button type="submit" disabled={loading}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventPage;
