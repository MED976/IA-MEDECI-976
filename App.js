import { useState } from 'react';

function App() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const sendMessage = async () => {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await res.json();
    setResponse(data.choices?.[0]?.message?.content || 'Pas de réponse');
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Assistant IA Médéci</h2>
      <textarea rows="4" cols="50" value={message} onChange={e => setMessage(e.target.value)} />
      <br />
      <button onClick={sendMessage}>Envoyer</button>
      <h3>Réponse :</h3>
      <p>{response}</p>
    </div>
  );
}

export default App;
