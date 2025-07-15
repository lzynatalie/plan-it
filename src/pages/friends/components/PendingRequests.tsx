import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useAuthContext } from "../../../context/AuthContext";
import {
  Friendship,
  getFriend,
  getPendingRequests,
  respondToRequest,
} from "../../../services/friendService";

const PendingRequests = () => {
  const { user, getProfile } = useAuthContext();
  const userId = user!.id;

  const [requests, setRequests] = useState<
    {
      friendshipId: string;
      friendId: string;
      username: string;
      sender_id: string;
      recipient_id: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  //to track which request ID being processsed and disable accept and decline buttons for these requests while awaiting response
  const [processingIDs, setProcessingIDs] = useState<string[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getPendingRequests(userId);
        const friendships = await Promise.all(
          data.map(async (friendship) => {
            const friendId = getFriend(userId, friendship);
            const profile = await getProfile(friendId);
            return {
              friendshipId: friendship.id, 
              friendId,
              username: profile.username,
              sender_id: friendship.sender_id,
              recipient_id: friendship.recipient_id,
            };
          })
        );
        setRequests(friendships);
      } catch (error) {
        if (error instanceof PostgrestError) {
          setErrorMessage(
            "Failed to load pending requests. Please try again later."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleResponse = (id: string, status: "accepted" | "declined") => {
    //mark current friendship request as being processed
    setProcessingIDs((prev) => [...prev, id]);

    respondToRequest(id, status)
      .then(() => {
        setRequests((prev) =>
          prev.filter((request) => request.friendshipId !== id)
        );
      })
      .catch((error) => {
        setErrorMessage(
          `Failed to ${
            status === "accepted" ? "accept" : "decline"
          } the request. Try again.`
        );
      })
      .finally(() => {
        //done processing, remove from tracker
        setProcessingIDs((prev) =>
          prev.filter((requestId) => requestId !== id)
        );
      });
  };

  if (loading) return <p>Loading pending requests...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;

  return (
    <div>
      <h2>Pending Requests</h2>

      <section>
        <h3>Incoming Friend Requests</h3>
        {requests.filter(r => r.recipient_id === userId).length === 0? (
          <p>No incoming friend requests.</p>
        ) : (
          <ul>
            {requests
            .filter(r => r.recipient_id === userId)
            .map((request) => (
              <li key={request.friendshipId}>
                <div className="box row">
                  <span>Friend request from: {request.username}</span>
                  <button
                  onClick={() => handleResponse(request.friendshipId, "accepted")}
                  disabled={processingIDs.includes(request.friendshipId)}
                  >
                    Accept
                  </button>
                  <button
                  onClick={() => handleResponse(request.friendshipId, "declined")}
                  disabled={processingIDs.includes(request.friendshipId)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Sent Friend Requests</h3>
        {requests.filter(r =>r.sender_id === userId).length === 0 ? (
          <p>No sent friend requests.</p>
        ) : (
          <ul>
            {requests
            .filter(r => r.sender_id === userId)
            .map((request) => (
              <li key={request.friendshipId}>
                <div className="box row">
                  <span>Request sent to: {request.username}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default PendingRequests;
