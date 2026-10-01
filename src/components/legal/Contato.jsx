import { useEffect, useState } from 'react';
import { getContato } from '../../services/database.js';

export default function Contato({ prefix }) {
  const [email, setEmail] = useState(null);

  useEffect(() => {
    let alive = true;
    getContato()
      .then(saved => { if (alive) setEmail(String(saved.email || '')); })
      .catch(() => { if (alive) setEmail(''); });
    return () => { alive = false; };
  }, []);

  if (email === null) return <p>{prefix}: carregando contato…</p>;
  if (!email) return <p>{prefix}: fale com a equipe responsável pelo acervo.</p>;
  return (
    <p>
      {prefix}: <a className="underline font-bold" href={`mailto:${email}`}>{email}</a>.
    </p>
  );
}
