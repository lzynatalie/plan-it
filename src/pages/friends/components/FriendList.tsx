import React, { useEffect, useState } from "react";
import {
  getFriendships,
  Friendship,
  getFriend,
  deleteFriendship
} from "../../../services/friendService";
import { useAuthContext } from "../../../context/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";

const FriendList = () => {
  const { user, getProfile } = useAuthContext();
  const userId = user!.id;

  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendshipsWithIds = await getFriendships();

        const friendshipsWithUsernames = await Promise.all(
          friendshipsWithIds.map(async (friendship) => {
            const isSender = friendship.sender_id === userId;
            const friendId = isSender
              ? friendship.recipient_id
              : friendship.sender_id;
            const profile = await getProfile(friendId);
            return { ...friendship, username: profile.username };
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
    const confirm = window.confirm(`Are you sure you want to remove ${friendUsername} from your friend list?`);
    if (!confirm) return;

    try {
      await deleteFriendship(friendshipId);
      setFriendships((prev) => prev.filter((friendship) => friendship.id !== friendshipId));
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
      <h2 className="text-xl font-bold mb-2">Your Friends</h2>
      {friendships.length === 0 ? (
        <p>You have no friends yet.</p>
      ) : (
        <ul className="space-y-2">
          {friendships.map((friendship) => (
            <li key={friendship.id} className="p-2 border rounded flex justify-between items-center">
              <span>Friend: <span className="font-mono">{friendship.username}</span></span>
              <button 
              onClick={() => handleDelete(friendship.id, friendship.username!)}
              className="px-2 py-1 bg-red-500 text-white rounded"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendList;
