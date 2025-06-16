import React, { useState, useEffect } from "react";
import Header from "../../components/header/Header";
import {
  EventData,
  getUser,
  addEvent,
  deleteEvent,
  updateEvent,
  getEvents,
} from "../../services/calendarService";

const CalendarPage = () => {
  const [userID, setUserID] = useState("");
  const [eventData, setEventData] = useState<EventData>({
    title: "",
    start_time: "",
    end_time: "",
  });
  //to track the event to be replaced, use null to track whether there is such an event
  const [updatedEventData, setUpdatedEventData] = useState<
    (EventData & { id: string }) | null
  >(null);

  //only fetch events and user info once, when the page first loads
  useEffect(() => {
    async function fetchUserAndEvents() {
      const user = await getUser();

      if (!user) {
        console.error("User not signed in.");
        //don't throw error because user may use app without signing in
        return;
      }

      setUserID(user.id);
      const eventData = await getEvents(user.id);
      setEventData(eventData[0]);
    }

    fetchUserAndEvents();
  }, []);

  //refresh to update calendar every time an event added, updated, deleted etc
  const refreshEvents = async () => {
    const data = await getEvents(userID);
    setEventData(data[0]);
  };

  const handleAddEvent = async () => {
    if (
      !userID ||
      !eventData.title ||
      !eventData.start_time ||
      !eventData.end_time
    )
      return;

    try {
      await addEvent({ ...eventData, user_id: userID });
      await refreshEvents();
      //event added, set to clean slate for next event
      setEventData({
        title: "",
        start_time: "",
        end_time: "",
      });
    } catch (e) {
      if (e instanceof Error) {
        console.error("Failed to add event:", e.message);
      }
    }
  };

  const handleUpdateEvent = async () => {
    //if event to update does not exist
    if (!updatedEventData) return;

    try {
      //replace the event to be updated with the event data the user keys in
      await updateEvent(updatedEventData.id, { ...eventData, user_id: userID });
      await refreshEvents();
      setUpdatedEventData(null);
      setEventData({
        title: "",
        start_time: "",
        end_time: "",
      });
    } catch (e) {
      if (e instanceof Error) {
        console.error("Failed to update event:", e.message);
      }
    }
  };

  const handleDeleteEvent = async (eventID: string) => {
    try {
      await deleteEvent(eventID);
      await refreshEvents();
    } catch (e) {
      if (e instanceof Error) {
        console.error("Failed to delete event:", e.message);
      }
    }
  };

  return (
    <div>
      <Header />
      <h2> Your Plan-It!</h2>

      <input
        type="text"
        placeholder="Title"
        value={eventData.title}
        onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
      />

      <input
        type="datetime-local"
        value="eventData.start_time"
        onChange={(e) =>
          setEventData({ ...eventData, start_time: e.target.value })
        }
      />

      <input
        type="datetime-local"
        value={eventData.end_time}
        onChange={(e) =>
          setEventData({ ...eventData, end_time: e.target.value })
        }
      />

      <button onClick={handleAddEvent}>Add Event</button>
      <button onClick={handleUpdateEvent} disabled={!updatedEventData}>
        Update Event
      </button>
    </div>
  );
};

export default CalendarPage;
