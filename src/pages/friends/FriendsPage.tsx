import React, { useState } from "react";
import Header from "../../components/header/Header";
import PendingRequests from "./components/PendingRequests";
import FriendList from "./components/FriendList";
import SendFriendRequest from "./components/SendFriendRequest";

const FriendsPage = () => {
  const [activePage, setActivePage] = useState<
    "friends" | "pending" | "requests"
  >("friends");

  return (
    <div className="container">
      <Header />

      <div className="main">
        <h1>Friends</h1>

        <div className="button-group">
          <button onClick={() => setActivePage("friends")}>Your Friends</button>
          <button onClick={() => setActivePage("pending")}>
            Pending Requests
          </button>
          <button onClick={() => setActivePage("requests")}>
            Send Request
          </button>
        </div>

        <div className="box">
          {activePage === "friends" && <FriendList />}
          {activePage === "pending" && <PendingRequests />}
          {activePage === "requests" && <SendFriendRequest />}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
