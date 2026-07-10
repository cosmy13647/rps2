import { useState } from 'react';

function getOrCreateSessionId() {
  let id = localStorage.getItem('guest_session_id');
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('guest_session_id', id);
  }
  return id;
}

export default function useGuestSession() {
  const [sessionId] = useState(getOrCreateSessionId);
  const [tableNumber, setTableNumberState] = useState(
    () => localStorage.getItem('table_number') || ''
  );

  const setTableNumber = (value) => {
    setTableNumberState(value);
    localStorage.setItem('table_number', value);
  };

  return { sessionId, tableNumber, setTableNumber };
}
