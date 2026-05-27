const OpenAI = require('openai');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({apiKey:process.env.OPENAI_API_KEY}) : null;

async function suggestReply(thread, messages) {
  if (!openai) return mockReply(thread, messages);
  try {
    const recent = messages.slice(-3).map(m => ({role:m.direction==='inbound'?'user':'assistant',content:m.text}));
    const resp = await openai.chat.completions.create({
      model:'gpt-4o-mini',
      messages:[{role:'system',content:'You are a helpful vacation rental assistant for Balay Kasadya Villa in Baclayon, Bohol, Philippines. Respond to guest messages on Airbnb, Booking.com, Vrbo. Generate a friendly, professional, concise reply under 50 words. Include guest name. Be warm. For problems: apologise, say someone is on it. Use UK English.'},...recent],
      max_tokens:120, temperature:0.7
    });
    return {suggested:resp.choices[0].message.content.trim()};
  } catch(e) { console.error('OpenAI error:', e.message); return mockReply(thread, messages); }
}

function mockReply(thread, messages) {
  const name = thread.guestName.split(' ')[0];
  const cat = thread.aiCategory||'general';
  const templates = {
    'pre-checkin':[`Hi ${name}! We're looking forward to welcoming you. I'll confirm the details shortly.`,`Hello ${name}! Great question — let me check with our team and get back to you quickly.`,`Hi ${name}! Absolutely, we can help with that. I'll send you all the details for a smooth arrival.`],
    upsell:[`Hi ${name}! That's a wonderful idea. Let me send you the options and we can arrange everything for your stay.`,`Hello ${name}! Yes, we offer that service. I'll send the details and pricing right away.`],
    damage:[`Hi ${name}, I'm so sorry — our maintenance team is on the way and will resolve this quickly.`,`Hello ${name}, thank you for reporting this. I've dispatched our team and will keep you updated.`],
    complaint:[`Hi ${name}, I sincerely apologise for the inconvenience. I'm addressing this now.`,`Hello ${name}, I understand your frustration. Let me resolve this immediately.`],
    general:[`Hi ${name}! Thanks for reaching out. I'd be happy to help — let me get the information you need.`,`Hello ${name}! Good question. Here's what you need to know.`]
  };
  const opts = templates[cat]||templates.general;
  return {suggested:opts[Math.floor(Math.random()*opts.length)]};
}

module.exports = {suggestReply};