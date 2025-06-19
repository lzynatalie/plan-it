import React, { useEffect, useState } from "react";
import Header from "../../../components/header/Header";
import { useNavigate, useParams } from "react-router-dom";
import {
  EventData,
  UserEvent,
  getEvent,
  deleteEvent,
  updateEvent,
} from "../../../services/calendarService";
import { PostgrestError } from "@supabase/supabase-js";

const EventPage = () => {
  const [currentEvent, setCurrentEvent] = useState<EventData>({
    id: "",
    creator_id: "",
    group_id: "",
    title: "Event",
    description: "",
    start_time: "",
    end_time: "",
  });
  const [updateEvent, setUpdateEvent] = useState(false);
  const [error, setError] = useState("");

  const { eventId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError("Event not found.");
        return;
      }

      const event = await getEvent(eventId);
      setCurrentEvent(event);
    };

    fetchEvent();
  }, []);

  // TODO
  const handleUpdateEvent = async () => {
    try {
    } catch (error) {
      if (error instanceof PostgrestError) {
        console.error("Failed to update event:", error.message);
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      navigate("/calendar");
    } catch (error) {
      if (error instanceof PostgrestError) {
        console.error("Failed to delete event:", error.message);
      }
    }
  };

  return (
    <div className="container">
      <Header />

      <div className="main">
        <h1>{currentEvent.title}</h1>

        <div className="box">
          {currentEvent.description && (
            <p>Description: {currentEvent.description}</p>
          )}
          <p>Start time: {currentEvent.start_time}</p>
          <p>End time: {currentEvent.end_time}</p>

          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}
        </div>

        {!updateEvent && (
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
        )}

        {updateEvent && (
          <UpdateEvent
            values={{ currentEvent }}
            functions={{ setUpdateEvent, setCurrentEvent }}
          />
        )}
      </div>
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
  };
};

const UpdateEvent = ({
  values: { currentEvent },
  functions: { setUpdateEvent, setCurrentEvent },
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
      await updateEvent(currentEvent.id, updatedEvent);
      setCurrentEvent({
        ...updatedEvent,
        id: currentEvent.id,
        creator_id: currentEvent.creator_id,
        group_id: currentEvent.group_id,
      });
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
        <input
          type="text"
          placeholder="Title"
          value={updatedEvent.title}
          onChange={(e) =>
            setUpdatedEvent({ ...updatedEvent, title: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Description"
          value={updatedEvent.description}
          onChange={(e) =>
            setUpdatedEvent({ ...updatedEvent, description: e.target.value })
          }
        />

        <input
          type="datetime-local"
          value={updatedEvent.start_time}
          onChange={(e) =>
            setUpdatedEvent({ ...updatedEvent, start_time: e.target.value })
          }
        />

        <input
          type="datetime-local"
          value={updatedEvent.end_time}
          onChange={(e) =>
            setUpdatedEvent({ ...updatedEvent, end_time: e.target.value })
          }
        />

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
