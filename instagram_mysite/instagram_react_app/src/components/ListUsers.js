import React, { useState, useEffect } from 'react';

const ListUsers = () => {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [createdAt, setCreatedAt] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    let url = `/api/users?`;

    if (username) url += `username=${username}&`;
    if (createdAt) url += `created_at=${createdAt}&`;

    const response = await fetch(url);
    const data = await response.json();
    setUsers(data.users || []);
  };

  return (
    <div>
      <h2>Popis korisnika</h2>
      <div>
        <input
          type="text"
          placeholder="Filtriraj po korisničkom imenu"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="date"
          placeholder="Filtriraj po datumu"
          value={createdAt}
          onChange={(e) => setCreatedAt(e.target.value)}
        />
        <button onClick={fetchUsers}>Filtriraj</button>
      </div>

      <ul>
        {users.length > 0 ? (
          users.map((user) => (
            <li key={user.id}>
              <strong>{user.username}</strong> - {user.contact_info} - {user.created_at}
            </li>
          ))
        ) : (
          <li>Nema korisnika.</li>
        )}
      </ul>
    </div>
  );
};

export default ListUsers;
