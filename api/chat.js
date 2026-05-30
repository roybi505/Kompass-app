export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, listContext } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is missing on the server.' });
  }

  // Format the user's list beautifully for the AI context
  const formattedList = listContext && listContext.length > 0 
    ? listContext.map(item => `- [${item.completed ? 'V' : ' '}] ${item.title} (${item.category})`).join('\n')
    : 'The list is currently empty.';

  const prompt = `You are Kompass, an intelligent, witty, and highly practical personal travel assistant. 
The user is planning their summer trip and tracking locations/tasks inside this mini app.

Here is the real-time up-to-date status of their summer bucket list ([V] means completed, [ ] means still pending):
${formattedList}

The user asked: "${message}"

Respond in fluent, clear, and modern English. Keep a lighthearted, smart-casual tone. 
If they ask for recommendations, transport logistics, or routes, use clean bullet points or bold headers so it is easily scannable on a smartphone screen while they are out exploring. Always prioritize or factor in what they have already visited or what's left on their active list if it adds contextual value.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply });
    } else {
      return res.status(502).json({ error: 'Invalid response from the AI model.' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
