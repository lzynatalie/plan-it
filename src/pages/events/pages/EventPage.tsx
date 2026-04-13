import { PostgrestError } from "@supabase/supabase-js";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import "./EventPage.css";
import ConfirmRecurringDelete from "../components/ConfirmDeleteModal";
import {
  EventData,
  UserEvent,
  PollTiming,
  deleteEvent,
  getAttendees,
  getEvent,
  getTimings,
  removeUser,
  respondToInvite,
  updateEvent,
  getEvents,
  deleteRecurringGroup,
  updateRecurringGroup,
  finalisePendingRecurringEvent,
  getPollTimings,
  getPollVotes,
  submitVote,
  checkPollCompletion,
  finalisePoll,
  removeVote,
  deletePollTiming
} from "../../../services/calendarService";

const toUTC = (isoString: string) => new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");

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
    label: ""
  });
  const [attendees, setAttendees] = useState<
    { id: string; username: string }[]
  >([]);
  const [timings, setTimings] = useState<{ start: string; end: string }[]>([]);
  const [updateEvent, setUpdateEvent] = useState(false);
  const [pollTimings, setPollTimings] = useState<PollTiming[]>([]);
  const [pollVotes, setPollVotes] = useState<any[]>([]);
  const [winningTimingIds, setWinningTimingIds] = useState<string[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const[softConflicts, setSoftConflicts] = useState<
  { start: string; end: string; label: "flexible" | "optional"; title?: string; ownerName: string; }[]
  >([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [range, setRange] = useState<"week" | "month" | "3months">("week");
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentEvent.id && currentEvent.id.trim() !== "") {
      fetchTimings();
    }
  }, [currentEvent.id, range]);

  useEffect(() => {
    if (showDeleteModal && modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showDeleteModal]);

  const { eventId } = useParams();
  const navigate = useNavigate();

  const refreshPollData = async () => {
    const pollTimings = await getPollTimings(eventId!);
    const pollVotes = await getPollVotes(eventId!);

    const existingVote = pollVotes.find(v => v.user_id === userId);
    setUserVote(existingVote?.timing_id || null);

    const voteMap = pollTimings.map((timing) => ({
      ...timing,
      votes: pollVotes.filter((v) => v.timing_id === timing.id).length,
    }));

    const maxVotes = Math.max(0, ...voteMap.map((t) => t.votes));
    const winningIds = voteMap.filter((t) => t.votes === maxVotes).map((t) => t.id);

    setPollTimings(voteMap);
    setPollVotes(pollVotes);
    setWinningTimingIds(winningIds);
  };


  const fetchAttendees = async () => {
    const attendees = await getAttendees(currentEvent.id);
    setAttendees(attendees);
  };

  const fetchTimings = async () => {
    if (!currentEvent.id || currentEvent.id.trim() === "") return;

    const { goodToGo, softConflicts } = (await getTimings(currentEvent.id)) as any;

    const now = new Date();
    let rangeLimit = new Date();

    if (range === "week") {
      rangeLimit.setDate(now.getDate() + 7);
    } else if (range === "month") {
      rangeLimit.setDate(now.getDate() + 30);
    } else if (range === "3months") {
      rangeLimit.setMonth(now.getMonth() + 3);
    }

    const filteredGoodToGo = goodToGo.filter((t: any) => {
      const startTime = new Date(t.start).getTime();
      return startTime >= now.getTime() && startTime <= rangeLimit.getTime();
    });

    const userMap = Object.fromEntries(attendees.map(a => [a.id, a.username]));

    const filteredSoftConflicts = softConflicts
        .filter((t: any) => {
          const startTime = new Date(t.start).getTime();
          return startTime >= now.getTime() && startTime <= rangeLimit.getTime();
        })
        .map((c: any) => ({
          ...c,
          ownerName: c.ownerName === userId ? "you" : userMap[c.ownerName] || "a user"
        }));

    setTimings(filteredGoodToGo);
    setSoftConflicts(filteredSoftConflicts);
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        if (!eventId) {
          setError("Event not found.");
          return;
        }

        const event = await getEvent(eventId);
        setCurrentEvent(event);

        const attendeesList = await getAttendees(eventId);
        setAttendees(attendeesList);

        // We need the map here too!
        const userMap = Object.fromEntries(attendeesList.map(a => [a.id, a.username]));

        const fetchedTimings = (await getTimings(eventId)) as any;

        const mappedSoftConflicts = fetchedTimings.softConflicts.map((c: any) => ({
          ...c,
          ownerName: c.ownerName === userId ? "you" : userMap[c.ownerName] || "a user"
        }));

        setTimings(fetchedTimings.goodToGo);
        setSoftConflicts(mappedSoftConflicts);

        // Poll if the event is pending
        if (!event.start_time || event.start_time === "") {
          await refreshPollData();
        }
      } catch (err: any) {
        console.error("Failed to load event details:", err);
        setError(err?.message || "Failed to load event.");
      }
    };

    fetchEventDetails();
  }, []);

  const handleJoinEvent = async () => {
    try {
      await respondToInvite(userId, currentEvent.id, "attending");
      await fetchAttendees();
      await fetchTimings();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to join event.");
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

  const isPending = !currentEvent.start_time || currentEvent.start_time === "";

  const uniqueSoftConflictTimings = Array.from(
      new Set(softConflicts.map((c) => `${c.start}|${c.end}`))
  ).map((str) => {
    const [start, end] = str.split("|");
    return { start, end };
  });

  return (
    <div className="main">
      <h1>{currentEvent.title}</h1>

      <div className="box">
        <h2>Event Details</h2>
        
        {currentEvent.recurrence && (
          <p className="helper-text">This is a recurring event: {currentEvent.recurrence} event
          {currentEvent.repeat_until &&
          ` (repeats until ${new Date(currentEvent.repeat_until).toLocaleDateString()})`}
          </p>
        )}

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

        {isPending && userId === currentEvent.creator_id && (
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ marginRight: "0.5rem" }}>View availability for:</label>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as "week" | "month" | "3months")}
              >
                <option value="week">Next 7 days</option>
                <option value="month">Next 30 days</option>
                <option value="3months">Next 3 months</option>
              </select>
            </div>

            <h2>Available Timings</h2>

            {/* Legend */}
            <div className="helper-text" style={{ marginBottom: "0.5rem" }}>
              <span style={{ backgroundColor: "#fff9c4", color: "#000", padding: "2px 6px", marginRight: "1rem" }}>
                Flexible (yellow)
              </span>
              <span style={{ backgroundColor: "#e8f5e9", color: "#000", padding: "2px 6px" }}>
                Optional (green)
              </span>
            </div>

            {/* Group timings by conflict status */}
            {timings.length > 0 ? (
              <>
                {/* Conflict-free timings */}
                <div className="box">
                  <h4>Good to go!</h4>
                  <ul>
                    {timings.map(({ start, end }, index) => (
                        <li key={`safe-${index}`}>
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
                                  recurrence: currentEvent.recurrence,
                                  repeat_until: currentEvent.repeat_until,
                                  label: currentEvent.label,
                                },
                                pendingEventDate: {
                                  title: currentEvent.title,
                                  description: currentEvent.description,
                                  eventId: currentEvent.id,
                                },
                                autoOpenForm: true,
                              },
                            });
                          }}
                        >
                          {new Date(start).toLocaleString()} - {new Date(end).toLocaleString()}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Timings with soft conflicts */}
                <div className="box">
                  <h4>Soft Conflicts</h4>
                  <ul>
                    {uniqueSoftConflictTimings.map(({ start, end }, index) => {
                      const conflictsForTiming = softConflicts.filter(c => c.start === start && c.end === end);

                      return (
                        <li key={`conflict-${index}`} style={{ marginBottom: "1rem" }}>
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
                                    recurrence: currentEvent.recurrence,
                                    repeat_until: currentEvent.repeat_until,
                                    label: currentEvent.label,
                                  },
                                  pendingEventDate: {
                                    title: currentEvent.title,
                                    description: currentEvent.description,
                                    eventId: currentEvent.id,
                                  },
                                  autoOpenForm: true,
                                },
                              });
                            }}
                          >
                            {new Date(start).toLocaleString()} - {new Date(end).toLocaleString()}
                          </button>

                          <ul style={{ marginTop: "0.25rem" }}>
                            {conflictsForTiming.map((conflict, cIndex) => (
                              <li
                                key={`conflict-desc-${cIndex}`}
                                style={{
                                  backgroundColor: conflict.label === "flexible" ? "#fff9c4" : "#e8f5e9",
                                  color: "#000",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "4px",
                                  marginBottom: "0.25rem",
                                  fontSize: "0.9rem"
                                }}
                              >
                                {conflict.ownerName === "you"
                                  ? `Clashes with your ${conflict.label} event "${conflict.title || 'Untitled'}"`
                                  : `Clashes with ${conflict.ownerName}'s ${conflict.label} event`}
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="helper-text" style={{ marginTop: "0.5rem" }}>
                    These timings overlap with <em>flexible</em> or <em>optional</em> events for one or more attendees.
                    Flexible events can be rescheduled, and optional ones may be skipped.
                  </p>
                </div>
              </>
            ) : (
              <div className="box">No available timings</div>
            )}
          </div>
        )}

        {isPending && userId !== currentEvent.creator_id && attendees.length > 1 && (
          <div className="box">
            <h3>Vote for your preferred time:</h3>
            {pollTimings.length > 0 ? (
              <ul>
                  {pollTimings.map((timing) => (
                  <li
                    key={timing.id}
                    className={winningTimingIds.includes(timing.id) ? "winning-option" : ""}
                  >
                    {userVote === timing.id ? (
                      <button
                        onClick={async () => {
                          try {
                            await removeVote(userId, timing.id);
                            refreshPollData();
                          } catch (err) {
                            console.error(err);
                            setError("Failed to remove vote.");
                          }
                        }}
                      >
                        Remove Vote
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            await submitVote(userId, timing.id);
                            await checkPollCompletion(currentEvent.id);
                            await refreshPollData();
                          } catch (err) {
                            console.error(err);
                            setError("Failed to submit vote.");
                          }
                        }}
                      >
                        Vote
                      </button>
                    )}
                    {timing.start_time.replace("T", " ").slice(0, 16)} – {timing.end_time.replace("T", " ").slice(0, 16)}
                    ({timing.votes} vote{timing.votes !== 1 ? "s" : ""})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No poll options available yet.</p>
            )}
          </div>
        )}

        {isPending && userId === currentEvent.creator_id && pollTimings.length > 0 && (
          <div className="box">
            <h3>Poll Options</h3>
            <ul>
              {pollTimings.map((timing) => (
                <li key={timing.id} className={winningTimingIds.includes(timing.id) ? "winning-option" : ""}>
                  <p>
                    {timing.start_time.replace("T", " ").slice(0, 16)} – {timing.end_time.replace("T", " ").slice(0, 16)}
                    ({timing.votes} vote{timing.votes !== 1 ? "s" : ""})
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await deletePollTiming(timing.id);
                        await refreshPollData();
                      } catch (err) {
                        console.error(err);
                        setError("Failed to delete poll option.");
                      }
                    }}
                  >
                    Delete Option
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={async () => {
                try {
                  await finalisePoll(currentEvent.id);
                  setSuccess("Poll finalised successfully!");
                  navigate(0); // refresh the page
                } catch (err) {
                  setError("Failed to finalise poll.");
                }
              }}
            >
              Finalise Poll Now
            </button>
          </div>
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
              onClick={() => {
                setShowDeleteModal(true)
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
          values={{ currentEvent, userId }}
          functions={{ setUpdateEvent, setCurrentEvent, setSuccess }}
        />
      )}

      {success && (
        <div className="success">
          <p>{success}</p>
        </div>
      )}

      {showDeleteModal && (
        <div ref={modalRef}>
          <ConfirmRecurringDelete
            onDeleteSingle={async () => {
              await deleteEvent(currentEvent.id);
              navigate("/events");
            }}
            onDeleteAll={
              currentEvent.recurrence && currentEvent.recurrence_group_id
                ? async () => {
                  await deleteRecurringGroup(currentEvent.recurrence_group_id!);
                  navigate("/events");
                }
              : undefined
            }
            onCancel={() => setShowDeleteModal(false)}
          />
        </div>
      )}      
    </div>
  );
};

type UpdateEventProps = {
  values: {
    currentEvent: EventData;
    userId: string;
  };
  functions: {
    setUpdateEvent: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentEvent: React.Dispatch<React.SetStateAction<EventData>>;
    setSuccess: React.Dispatch<React.SetStateAction<string>>;
  };
};

const UpdateEvent = ({
  values: { currentEvent, userId },
  functions: { setUpdateEvent, setCurrentEvent, setSuccess },
}: UpdateEventProps) => {
  const [updatedEvent, setUpdatedEvent] = useState<UserEvent>({
    title: currentEvent.title,
    description: currentEvent.description,
    start_time: currentEvent.start_time,
    end_time: currentEvent.end_time,
    label: currentEvent.label
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
          if (e.label === "flexible" || e.label === "optional") return false;

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

          let message = "";

          if (conflicting.ownerId === userId) {
            message = `Updated event clashes with your event "${conflicting.title}" (${formattedStart} - ${formattedEnd})`;
          } else {
            const username = attendeeMap[conflicting.ownerId] || "a member";
            message = `Updated event clashes with ${username}'s event (${formattedStart} - ${formattedEnd})`;
          }

          setError(message);
          setLoading(false);
          return;
        }
      }

      const updateAll = currentEvent.recurrence_group_id
        ? window.confirm("This is a recurring event. Apply update to all occurrences?")
        : false;

      if (updateAll && currentEvent.recurrence_group_id) {
        await updateRecurringGroup(currentEvent.recurrence_group_id, updatedEvent);
        setSuccess("All recurring events updated successfully!");
      } else {
        const isPendingRecurring =
          currentEvent.recurrence &&
          currentEvent.repeat_until &&
          currentEvent.recurrence_group_id &&
          !currentEvent.start_time &&
          !currentEvent.end_time;

        if (isPendingRecurring) {
          const { error } = await finalisePendingRecurringEvent(
            currentEvent,
            updatedEvent.start_time!,
            updatedEvent.end_time!
          );

          if (error) {
            setError("Failed to finalise recurring event.");
            setLoading(false);
            return;
          }

          setSuccess("Recurring event finalised!");
          setUpdateEvent(false);
          setLoading(false);
          return;
        }

        await updateEvent(currentEvent.id, {
          ...updatedEvent,
          recurrence: currentEvent.recurrence ?? undefined,
          recurrence_group_id: currentEvent.recurrence_group_id ?? undefined,
          repeat_until: currentEvent.repeat_until ?? undefined,
        });
        setSuccess("Event updated successfully!");

        try {
          const refreshed = await getEvent(currentEvent.id);
          setCurrentEvent(refreshed);
        } catch (err) {
          console.error("Failed to refetch event:", err);
        }
      }
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

        <div className="input-group">
          <label htmlFor="label">Priority</label>
          <select
            id="label"
            required
            value={updatedEvent.label || ""}
            onChange={(e) =>
              setUpdatedEvent((prev) => ({
                ...prev,
                label: e.target.value as "compulsory" | "flexible" | "optional",
              }))
            }
          >
            <option value="" disabled>Select event priority (required)</option>
            <option value="compulsory">Compulsory event (Red)</option>
            <option value="flexible">Flexible event, open to rescheduling (Yellow)</option>
            <option value="optional">Optional event, open to skipping (Green)</option>
          </select>
          <small className="helper-text">
            Update the event priority level if your plans have changed, or to help others plan around this event!
          </small>
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