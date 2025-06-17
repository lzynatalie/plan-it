import React from "react";
import Header from "../../components/header/Header";

const EventsPage = () => {
  return (
    <div className="container">
      <Header />

      <div className="main">
        <h1>Events</h1>

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

export default EventsPage;
