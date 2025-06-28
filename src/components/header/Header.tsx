import { Link } from "react-router-dom";

import logo from "../assets/logo.png";
import styles from "./Header.module.css";

const Header = () => {
  return (
    <div className={styles.header}>
      <img className={styles.logo} src={logo} />
      <p className={styles.name}>Plan-It!</p>
      <Link className={styles.link} to="/home">
        Home
      </Link>
      <Link className={styles.link} to="/calendar">
        Calendar
      </Link>
      <Link className={styles.link} to="/events">
        Events
      </Link>
      <Link className={styles.link} to="/friends">
        Friends
      </Link>
      <Link className={styles.link} to="/groups">
        Groups
      </Link>
      <Link className={styles.link} to="/venues">
        Venues
      </Link>
    </div>
  );
};

export default Header;
