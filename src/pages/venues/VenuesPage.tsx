import React from "react";
import Header from "../../components/header/Header";

const VenuesPage = () => {
  return (
    <div className="container">
      <Header />

      <div className="main">
        <h1>Venues</h1>

        <div className="box">No venues yet</div>
      </div>
    </div>
  );
};

export default VenuesPage;
