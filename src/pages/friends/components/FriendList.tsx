import React, { useEffect, useState } from "react";
import {
  getFriendships,
  Friendship,
  getFriend,
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
            <li key={friendship.id} className="p-2 border rounded">
              Friend: <span className="font-mono">{friendship.username}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendList;
