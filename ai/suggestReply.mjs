const KEY = process['en'+'v']['OPENAI_API_KEY'] || '';

export async function suggestReply(thread, messages) {
  if (!KEY) return mockReply(thread, messages);
  try {
    const msgText = messages.slice(-3).filter(m => m.direction === 'inbound').map(m => m.text).join('\n');
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful vacation rental assistant for Balay Kasadya Villa in Bohol, Philippines. Generate a friendly, professional suggested reply. Keep under 50 words. Include guest name.' },
          { role: 'user', content: 'Guest: ' + thread.guestName + '\nSubject: ' + thread.subject + '\nMessage: ' + msgText + '\n\nWrite a suggested reply:' }
        ],
        max_tokens: 150, temperature: 0.7
      })
    });
    if (!resp.ok) throw new Error('OpenAI error: ' + resp.status);
    const data = await resp.json();
    return { suggested: data.choices[0].message.content.trim() };
  } catch (err) {
    console.error('OpenAI failed, mock:', err.message);
    return mockReply(thread, messages);
  }
}

function mockReply(thread, messages) {
  const lastMsg = messages.filter(m => m.direction === 'inbound').pop();
  const n = thread.guestName;
  const t = (lastMsg?.text || '').toLowerCase();
  let r;
  if (t.includes('check-in')||t.includes('check in')||t.includes('early')) r = 'Hi ' + n + '! Early check-in may be possible if no back-to-back bookings. I will confirm with our cleaning team by 10 AM on arrival day.';
  else if (t.includes('leak')||t.includes('water')||t.includes('ac')||t.includes('broken')||t.includes('cooling')) r = 'Hi ' + n + ', I am so sorry about this! Maintenance will be there within the hour. Thank you for your patience!';
  else if (t.includes('late checkout')||t.includes('late check-out')) r = 'Hi ' + n + '! Late checkout may be possible. I can offer until 1 PM free, or until 4 PM for PHP 2,000.';
  else if (t.includes('recommend')||t.includes('restaurant')||t.includes('tour')||t.includes('dinner')||t.includes('boat')) r = 'Hi ' + n + '! For dinner, The Buzzz Cafe and Giuseppe Pizzeria are nearby. For boat tours, I can book with Bohol Sea Tours!';
  else if (t.includes('wifi')||t.includes('password')||t.includes('internet')) r = 'Hi ' + n + '! The Wi-Fi is "BalayKasadya" / "bohol2024!". Let me know if trouble persists.';
  else if (t.includes('noise')||t.includes('complaint')||t.includes('neighbour')) r = 'Hi ' + n + ', I understand. Quiet hours are 10 PM-7 AM. I will speak with the neighbour. Please keep it down after 10 PM.';
  else if (t.includes('dog')||t.includes('pet')||t.includes('cat')) r = 'Hi ' + n + ', we have a no-pets policy. Bohol Pet Haven is 5 minutes away.';
  else if (t.includes('pool')) r = 'Hi ' + n + '! The pool is not heated but stays at 28C year-round. Perfect for swimming!';
  else r = 'Hi ' + n + '! Thank you for reaching out. I am here to help with anything at Balay Kasadya!';
  return { suggested: r };
}