import React, { useEffect, useState } from "react";
import Header from "../../components/header/Header";
import { getGroups, Group } from "../../services/groupService";
import { PostgrestError } from "@supabase/supabase-js";

const GroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groups = await getGroups();
        setGroups(groups);
      } catch (error) {
        if (error instanceof PostgrestError) {
          setError(error.message);
        }
      }
    };

    fetchGroups();
  }, []);

  return (
    <div className="container">
      <Header />

      <div className="main">
        <h1>Groups</h1>

        <div className="box">
          {groups.length ? (
            <ul>
              {groups.map(({ id, name }) => (
                <li key={id}>
                  <div className="box row">
                    <div className="column">
                      <p>{name}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            "No groups yet"
          )}
        </div>

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
