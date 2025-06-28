import { PostgrestError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext, UserData } from "../../context/AuthContext";
import { getFriend, getFriendships } from "../../services/friendService";
import { Group, createGroup, getGroups } from "../../services/groupService";

const GroupsPage = () => {
  const { user, getProfile } = useAuthContext();
  const userId = user!.id;

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<
    {
      friendshipId: string;
      friendId: string;
      username: string;
    }[]
  >([]);
  const [friends, setFriends] = useState<
    {
      friendshipId: string;
      friendId: string;
      username: string;
    }[]
  >([]);
  const [createNewGroup, setCreateNewGroup] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

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

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    const memberIds = members.map((member) => member.friendId);
    await createGroup(groupName, userId, memberIds);
    await fetchGroups();
    setCreateNewGroup(false);
  };

  const handleViewGroup = async (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <div className="main">
      <h1>Groups</h1>

      {createNewGroup && (
        <CreateGroup
          values={{ userId, groupName, members, friends }}
          functions={{
            setGroupName,
            setMembers,
            setFriends,
            setCreateNewGroup,
            setError,
            handleCreateGroup,
            getProfile,
          }}
        />
      )}

      {!createNewGroup && (
        <button onClick={(e) => setCreateNewGroup(true)}>Create group</button>
      )}

      {groups.length ? (
        <ul>
          {groups.map(({ id, name }) => (
            <li key={id}>
              <div className="box row">
                <p>{name}</p>
                <button onClick={(e) => handleViewGroup(id)}>View</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="box">No groups yet</div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

type CreateGroupProps = {
  values: {
    userId: string;
    groupName: string;
    members: {
      friendshipId: string;
      friendId: string;
      username: string;
    }[];
    friends: {
      friendshipId: string;
      friendId: string;
      username: string;
    }[];
  };
  functions: {
    setGroupName: React.Dispatch<React.SetStateAction<string>>;
    setMembers: React.Dispatch<
      React.SetStateAction<
        {
          friendshipId: string;
          friendId: string;
          username: string;
        }[]
      >
    >;
    setFriends: React.Dispatch<
      React.SetStateAction<
        {
          friendshipId: string;
          friendId: string;
          username: string;
        }[]
      >
    >;
    setCreateNewGroup: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string>>;
    handleCreateGroup: () => Promise<void>;
    getProfile: (userId?: string) => Promise<UserData>;
  };
};

const CreateGroup = ({
  values: { userId, groupName, members, friends },
  functions: {
    setGroupName,
    setMembers,
    setFriends,
    setCreateNewGroup,
    setError,
    handleCreateGroup,
    getProfile,
  },
}: CreateGroupProps) => {
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendships = await getFriendships();
        const friends = await Promise.all(
          friendships.map(async (friendship) => {
            const friendId = getFriend(userId, friendship);
            const profile = await getProfile(friendId);
            return {
              friendshipId: friendship.id,
              friendId: getFriend(userId, friendship),
              username: profile.username,
            };
          })
        );
        setFriends(friends);
      } catch (error) {
        if (error instanceof PostgrestError) {
          setError(error.message);
        }
      }
    };

    fetchFriends();
  }, []);

  return (
    <div className="box">
      <input
        type="text"
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        required
      />

      <ul>
        <h2>Member List</h2>
        {members.map((member) => (
          <li key={member.friendshipId}>
            <div className="box row">
              <div className="column">
                <p>{member.username}</p>
              </div>

              <button
                onClick={(e) => {
                  setMembers((prev) =>
                    prev.filter((m) => m.friendshipId !== member.friendshipId)
                  );
                  setFriends((prev) => [...prev, member]);
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {friends.length > 0 && (
        <ul>
          <h2>Friends</h2>

          {friends.map((friend) => (
            <li key={friend.friendshipId}>
              <div className="box row">
                <div className="column">
                  <p>{friend.username}</p>
                </div>

                <button
                  onClick={(e) => {
                    setMembers((prev) => [...prev, friend]);
                    setFriends((prev) =>
                      prev.filter((f) => f.friendshipId !== friend.friendshipId)
                    );
                  }}
                >
                  Invite
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="row">
        <button onClick={(e) => setCreateNewGroup(false)}>Close</button>
        <button onClick={(e) => handleCreateGroup()}>Create</button>
      </div>
    </div>
  );
};

export default GroupsPage;
