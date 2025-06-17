import React, { useEffect, useState } from "react";
import Header from "../../../components/header/Header";
import { useParams } from "react-router-dom";
import {
  UserEventData,
  getEvent,
  deleteEvent,
  updateEvent,
} from "../../../services/calendarService";
import { PostgrestError } from "@supabase/supabase-js";

const EventPage = () => {
  const [event, setEvent] = useState<UserEventData>({
    id: "",
    user_id: "",
    title: "Event",
    start_time: "",
    end_time: "",
  });
  const [update, setUpdate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { eventId } = useParams();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError("Event not found.");
        return;
      }

      const event = await getEvent(eventId);
      setEvent(event);
    };

    fetchEvent();
  });

  // TODO
  const handleUpdateEvent = async () => {
    try {
    } catch (error) {
      if (error instanceof PostgrestError) {
        console.error("Failed to update event:", error.message);
      }
    }
  };

  // TODO
  const handleDeleteEvent = async (eventId: string) => {
    try {
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
        <h1>{event.title}</h1>

        <div className="box">
          <p>Start time: {event.start_time}</p>
          <p>End time: {event.end_time}</p>

          <div className="error">{error && <p>{error}</p>}</div>

          <div className="row">
            <button
              onClick={(e) => {
                setUpdate(true);
              }}
            >
              Update
            </button>
            <button
              onClick={(e) => {
                handleDeleteEvent(event.id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPage;
