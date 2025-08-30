import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const UserDetail = () => {
  const { id } = useParams(); 
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${id}/`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((error) => console.error('Error fetching user:', error));
  }, [id]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.error('User not logged in');
    }
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>Detalji Korisnika</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Korisničko ime:</strong> {user.username}</p>
      <p><strong>Kontakt:</strong> {user.contact_info}</p>
      <p><strong>Puno ime:</strong> {user.full_name}</p>
      <p><strong>Datum kreiranja:</strong> {new Date(user.created_at).toLocaleString()}</p>
      <p><strong>Datum ažuriranja:</strong> {new Date(user.updated_at).toLocaleString()}</p>
    </div>
  );
};

export default UserDetail;
 