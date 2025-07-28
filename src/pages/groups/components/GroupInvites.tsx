import { useEffect, useState } from "react";
import { useAuthContext } from "../../../context/AuthContext";
import { Group, getGroupInvites, respondToGroupInvite } from "../../../services/groupService";
import { useNavigate } from "react-router-dom";

type GroupInvitesProps = {
  refreshFlag: number;
  setRefreshFlag: React.Dispatch<React.SetStateAction<number>>;
};

const GroupInvites = ({ refreshFlag, setRefreshFlag }: GroupInvitesProps) => {
  const { user } = useAuthContext();
  const userId = user!.id;

  const [invites, setInvites] = useState<Group[]>([]);
  const navigate = useNavigate();

  const fetchInvites = async () => {
    const data = await getGroupInvites(userId);
    setInvites(data);
  };

  useEffect(() => {
    fetchInvites();
  }, [refreshFlag]);

  const handleAccept = async (groupId: string) => {
    await respondToGroupInvite(userId, groupId, "accepted");
    await fetchInvites();
    setRefreshFlag((prev) => prev + 1);
  };

  const handleDecline = async (groupId: string) => {
    await respondToGroupInvite(userId, groupId, "declined");
    await fetchInvites();
    setRefreshFlag((prev) => prev + 1);
  };

  return (
    <div>
      <h2>Group Invites</h2>
      {invites.length > 0 ? (
        <ul>
          {invites.map(({ id, name }) => (
            <li key={id}>
              <div className="box row">
                <p>{name}</p>
                <button onClick={() => navigate(`/groups/${id}`)}>View</button>
                <button onClick={() => handleAccept(id)}>Accept</button>
                <button onClick={() => handleDecline(id)}>Decline</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="box">No group invites</div>
      )}
    </div>
  );
};

export default GroupInvites;
