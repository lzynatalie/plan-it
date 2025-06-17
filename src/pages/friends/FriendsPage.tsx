import React from "react";
import Header from "../../components/header/Header";

const FriendsPage = () => {
  return (
    <div className="container">
      <Header />

      <div className="main">
        <h1>Friends</h1>

        <div className="box">No friends yet</div>
      </div>
    </div>
  );
};

export default FriendsPage;
