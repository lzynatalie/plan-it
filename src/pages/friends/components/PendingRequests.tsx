import React, { useEffect, useState } from "react";
import {
  getPendingRequests,
  respondToRequest,
  Friendship,
} from "../../../services/friendService";
import { useAuthContext } from "../../../context/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";

const PendingRequests = () => {
  const { user } = useAuthContext();
  const userId = user!.id;

  const [requests, setRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  //to track which request ID being processsed and disable accept and decline buttons for these requests while awaiting response
  const [processingIDs, setProcessingIDs] = useState<string[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getPendingRequests(userId);
        setRequests(data);
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
        setRequests((prev) => prev.filter((request) => request.id !== id));
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
  if (errorMessage) return <p className="text-red-500">{errorMessage}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Pending Requests</h2>
      {requests.length === 0 ? (
        <p>You have no pending friend requests.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((request) => (
            <li
              key={request.id}
              className="p-2 border rounded flex justify-between items-center"
            >
              <span>
                From: <span className="font-mono">{request.username}</span>
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => handleResponse(request.id, "accepted")}
                  disabled={processingIDs.includes(request.id)}
                  className="px-2 py-1 bg-green-500 text-white rounded disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleResponse(request.id, "declined")}
                  disabled={processingIDs.includes(request.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PendingRequests;
