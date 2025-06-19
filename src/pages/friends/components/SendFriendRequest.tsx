import React, { useEffect, useState } from "react";
import { sendFriendRequest, getUserIDByUsername } from "../../../services/friendService";
import { useAuthContext } from "../../../context/AuthContext";

const SendFriendRequest: React.FC = () => {
  const { user } = useAuthContext();
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
      const recipientID = await getUserIDByUsername(username);

      if (!recipientID) {
        setMessage("User not found.");
        setLoading(false);
        return;
      }

      if (recipientID === user!.id) {
        setMessage("You can't send a friend request to yourself!");
        setLoading(false);
        return;
      }

      await sendFriendRequest(user!.id, recipientID);
      setMessage("Friend request sent!");
      setUsername("");
    } catch (error: any) {
      console.error("Failed to send request:", error.message);
      setMessage(error.message || "Something went wrong. Please try again.");
    } finally {
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
