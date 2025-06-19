import React, { useEffect, useState } from "react";
import { getFriends, Friend } from "../../../services/friendService";
import { useAuthContext } from "../../../context/AuthContext";

const FriendList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchFriends = async () => {
      try {
        const data = await getFriends(user!.id);
        setFriends(data);
      } catch (error: any) {
        console.error("Failed to fetch friends:", error.message);
        setErrorMessage("Failed to load friends. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [user]);

  if (loading) return <p>Loading friends...</p>;
  if (errorMessage) return <p className="text-red-500">{errorMessage}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Your Friends</h2>
      {friends.length === 0 ? (
        <p>You have no friends yet.</p>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => {
            const isSender = friend.user_id === user!.id;
            const friendID = isSender ? friend.friend_id : friend.user_id;

            return (
              <li key={friend.id} className="p-2 border rounded">
                Friend ID: <span className="font-mono">{friendID}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FriendList;
