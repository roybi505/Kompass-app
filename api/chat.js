export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, listContext } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'מפתח ה-API של Gemini חסר בשרת.' });
  }

  // Format the user's list beautifully for the AI context
  const formattedList = listContext && listContext.length > 0 
    ? listContext.map(item => `- [${item.completed ? 'V' : ' '}] ${item.title} (${item.category})`).join('\n')
    : 'הרשימה כרגע ריקה.';

  const prompt = `אתה עוזר טיולים אישי אינטליגנטי, שנון וממוקד בשם Kompass.
המשתמש מתכנן את הקיץ שלו ומנהל רשימת יעדים ומשימות באפליקציה. 

להלן המצב הנוכחי והמעודכן בזמן אמת של הרשימה שלו (מסומן ב-[V] מה שבוצע, וב-[ ] מה שעדיין נשאר לעשות):
${formattedList}

המשתמש שאל: "${message}"

ענה לו בעברית רהוטה, קלילה, בגובה העיניים ועם מעט הומור. 
אם הוא מבקש המלצות, דרכי הגעה או לוגיסטיקה, עזור לו בצורה ממוקדת (השתמש בבולטים או בכותרות קטנות כדי שהתשובה תהיה קריאה וסרוקה בשלוף מהטלפון). תמיד תתחשב במה שהוא כבר עשה או במה שנשאר לו לעשות מהרשימה שלו במידה וזה רלוונטי לחוויה.`;

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
      return res.status(505).json({ error: 'תגובה לא תקינה מהמודל.' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
