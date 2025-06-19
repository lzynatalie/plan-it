import React, { useEffect, useState } from "react";
import { getPendingRequests, respondToRequest, Friend } from "../../../services/friendService";
import { useAuthContext } from "../../../context/AuthContext";

const PendingRequests: React.FC = () => {
  const { user } = useAuthContext();
  const [requests, setRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  //to track which request ID being processsed and disable accept and decline buttons for these requests while awaiting response
  const [processingIDs, setProcessingIDs] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchRequests = async () => {
      try {
        const data = await getPendingRequests(user!.id);
        setRequests(data);
      } catch (err: any) {
        console.error("Failed to fetch pending requests:", err.message);
        setErrorMessage("Failed to load pending requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const handleResponse = (id: number, status: "accepted" | "declined") => {
    //mark current frendship request as being processed
    setProcessingIDs(prev => [...prev, id]);

    respondToRequest(id, status)
      .then(() => {
        setRequests((prev) => prev.filter((request) => request.id !== id));
      })
      .catch((error) => {
        console.error(`Failed to ${status} the friend request:`, error.message);
        setErrorMessage(`Failed to ${status} the request. Try again.`);
      })
      .finally(() => {
        //done processing, remove from tracker
        setProcessingIDs(prev => prev.filter(requestID => requestID !== id));
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
            <li key={request.id} className="p-2 border rounded flex justify-between items-center">
              <span>
                From: <span className="font-mono">{request.user_id}</span>
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
