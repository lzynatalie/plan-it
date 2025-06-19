import React, { useState } from "react";
import Header from "../../components/header/Header";
import { GroupEvent } from "../../services/calendarService";

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
  const [newEvent, setNewEvent] = useState<GroupEvent>({
    group_id: "",
    title: "",
    description: "",
    start_time: "",
    end_time: "",
  });
  const [loading, setLoading] = useState(false);

  // TODO
  const handleCreateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="box">
      <form className="column" action="" onSubmit={handleCreateEvent}>
        <input
          type="text"
          placeholder="Title"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Description"
          value={newEvent.description}
          onChange={(e) =>
            setNewEvent({ ...newEvent, description: e.target.value })
          }
        />

        <input
          type="datetime-local"
          value={newEvent.start_time}
          onChange={(e) =>
            setNewEvent({ ...newEvent, start_time: e.target.value })
          }
        />

        <input
          type="datetime-local"
          value={newEvent.end_time}
          onChange={(e) =>
            setNewEvent({ ...newEvent, end_time: e.target.value })
          }
        />

        <button>Invite Friends</button>

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

// TODO
const InviteFriends = () => {
  return <div className="box"></div>;
};

export default EventsPage;
