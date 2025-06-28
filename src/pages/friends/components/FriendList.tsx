import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useAuthContext } from "../../../context/AuthContext";
import {
  deleteFriendship,
  getFriend,
  getFriendships,
} from "../../../services/friendService";

const FriendList = () => {
  const { user, getProfile } = useAuthContext();
  const userId = user!.id;

  const [friendships, setFriendships] = useState<
    {
      id: string;
      friendId: string;
      username: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendshipsWithIds = await getFriendships();

        const friendshipsWithUsernames = await Promise.all(
          friendshipsWithIds.map(async (friendship) => {
            const friendId = getFriend(userId, friendship);
            const profile = await getProfile(friendId);
            return {
              id: friendship.id,
              friendId: getFriend(userId, friendship),
              username: profile.username,
            };
          })
        );

        setFriendships(friendshipsWithUsernames);
      } catch (error) {
        if (error instanceof PostgrestError) {
          setErrorMessage("Failed to load friends. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [user, getProfile]);

  const handleDelete = async (friendshipId: string, friendUsername: string) => {
    const confirm = window.confirm(
      `Are you sure you want to remove ${friendUsername} from your friend list?`
    );
    if (!confirm) return;

    try {
      await deleteFriendship(friendshipId);
      setFriendships((prev) =>
        prev.filter((friendship) => friendship.id !== friendshipId)
      );
    } catch (error) {
      if (error instanceof PostgrestError) {
        setErrorMessage("Failed to delete friend. Please try again later.");
      }
    }
  };

  if (loading) return <p>Loading friends...</p>;
  if (errorMessage) return <p className="text-red-500">{errorMessage}</p>;

  return (
    <div>
      <h2>Your Friends</h2>
      {friendships.length === 0 ? (
        <p>You have no friends yet.</p>
      ) : (
        <ul>
          {friendships.map((friendship) => (
            <li key={friendship.id}>
              <div className="box row">
                <p>{friendship.username}</p>
                <button
                  onClick={() =>
                    handleDelete(friendship.id, friendship.username!)
                  }
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendList;
