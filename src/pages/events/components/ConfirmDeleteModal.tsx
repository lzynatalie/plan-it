import React from "react";

type ConfirmDeleteModalProps = {
  onDeleteSingle: () => void;
  onDeleteAll?: () => void;
  onCancel: () => void;
  note?: string;
};

const ConfirmDeleteModal = ({
  onDeleteSingle,
  onDeleteAll,
  onCancel,
  note,
}: ConfirmDeleteModalProps) => {
  return (
    <div className="modal box">
      <h3>Delete Event</h3>
      <p>
        {onDeleteAll
          ? "This event is part of a recurring series. What would you like to delete?"
          : "Are you sure you want to delete this event?"}
      </p>

      {note && <p className="helper-text">{note}</p>}

      <div className="row">
        <button onClick={onDeleteSingle}>
          {onDeleteAll ? "Only this event" : "Delete"}
        </button>

        {onDeleteAll && (
          <button onClick={onDeleteAll}>All events in the series</button>
        )}

        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
