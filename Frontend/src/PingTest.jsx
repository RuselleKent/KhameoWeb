import { useEffect, useState } from 'react';
import axios from 'axios';

export default function PingTest() {
  const [msg, setMsg] = useState('Loading…');

  useEffect(() => {
    axios.get('/api/ping')
      .then((res) => setMsg(res.data.message))
      .catch(() => setMsg("Couldn't reach Laravel"));
  }, []);

  return <h1 className="p-6 text-2xl">{msg} 👋</h1>;
}