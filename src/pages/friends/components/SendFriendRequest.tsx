import { PostgrestError } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuthContext } from "../../../context/AuthContext";
import { getUserId, sendFriendRequest } from "../../../services/friendService";

const SendFriendRequest = () => {
  const { user } = useAuthContext();
  const userId = user!.id;

  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    setMessage("");
    setLoading(true);

    if (!username.trim()) {
      setMessage("Please enter a username.");
      setLoading(false);
      return;
    }

    try {
      const recipientId = await getUserId(username);

      if (!recipientId) {
        setMessage("User not found.");
        setLoading(false);
        return;
      }

      if (recipientId === user!.id) {
        setMessage("You can't send a friend request to yourself!");
        setLoading(false);
        return;
      }

      await sendFriendRequest(userId, recipientId);
      setMessage("Friend request sent!");
    } catch (error) {
      if (error instanceof PostgrestError) {
        setMessage("Failed to send friend request. Please try again later.");
      } else if (error instanceof Error) {
        setMessage(error.message);
      }
    } finally {
      setUsername("");
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-x1 font-bold mb-2">Send Friend Request</h2>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 mr-2 rounded"
      />
      <button
        onClick={handleSendRequest}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send"}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
};

export default SendFriendRequest;
