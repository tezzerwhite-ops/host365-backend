const path = require('path');
const fs = require('fs');
const dbPath = path.join(__dirname, 'host365.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = require('./db');
const database = db.getDb();
console.log('Seeding Host365...');

// Property
database.prepare("INSERT INTO properties VALUES (1,'Balay Kasadya Villa','Baclayon, Bohol, Philippines',5,10,12731,'684301631777591176','BOH-89712','VRBO-55329','/villa.jpg','Stunning 5-bedroom villa with panoramic ocean views, private infinity pool, tropical gardens. Sleeps 10.')").run();

// Bookings
const bookings = [
  [1,'Maria Santos','Airbnb','2026-05-28','2026-06-02',6,63655],
  [2,'James & Emily Chen','Booking.com','2026-06-05','2026-06-08',4,38193],
  [3,'Hiroshi Tanaka','Airbnb','2026-06-15','2026-06-22',8,89117],
  [4,'The Andersson Family','Vrbo','2026-07-01','2026-07-07',10,91738],
  [5,'Dubai Group','Booking.com','2026-07-15','2026-07-20',7,74275],
  [6,'David & Lisa Park','Airbnb','2026-08-05','2026-08-10',5,74925],
  [7,'Priya Mukherjee','Booking.com','2026-09-10','2026-09-14',6,61856],
  [8,'Carlos & Friends','Airbnb','2026-10-01','2026-10-04',4,45778],
];
const insB = database.prepare("INSERT INTO bookings (id,propertyId,guestName,channel,checkin,checkout,guests,totalRevenue,status) VALUES (?,1,?,?,?,?,?,?,'confirmed')");
for (const b of bookings) insB.run(...b);

// Threads
const now = new Date();
const h = (hrs) => new Date(now.getTime()-hrs*3600000).toISOString();
const threads = [
  [1,1,1,'Maria Santos','Airbnb','Early check-in request','open','urgent','pre-checkin',h(5),h(1)],
  [2,1,1,'Maria Santos','Airbnb','Question about pool access','resolved','normal','general',h(48),h(30)],
  [3,1,2,'James Chen','Booking.com','Airport transfer inquiry','open','normal','pre-checkin',h(72),h(4)],
  [4,1,3,'Hiroshi Tanaka','Airbnb','Late checkout June 22','open','urgent','pre-checkin',h(8),h(2)],
  [5,1,3,'Hiroshi Tanaka','Airbnb','Extra bed for child','resolved','normal','upsell',h(96),h(80)],
  [6,1,4,'Annika Andersson','Vrbo','Grocery delivery before arrival','open','normal','pre-checkin',h(24),h(3)],
  [7,1,4,'Annika Andersson','Vrbo','Pool heating question','resolved','low','general',h(120),h(90)],
  [8,1,5,'Rashid Al-Maktoum','Booking.com','Private chef inquiry','open','normal','upsell',h(16),h(2)],
  [9,1,5,'Rashid Al-Maktoum','Booking.com','Water leak in master bathroom','open','urgent','damage',h(3),h(1)],
  [10,1,6,'David Park','Airbnb','WiFi password help','resolved','low','general',h(150),h(130)],
  [11,1,6,'Lisa Park','Airbnb','Neighbor noise complaint','open','urgent','complaint',h(6),h(0.5)],
  [12,1,7,'Priya Mukherjee','Booking.com','Vegetarian restaurant recommendations','open','normal','general',h(12),h(6)],
];
const insT = database.prepare("INSERT INTO threads (id,propertyId,bookingId,guestName,channel,subject,status,priority,aiCategory,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
for (const t of threads) insT.run(...t);

// Messages
const msgs = [
  [1,'inbound','Airbnb','Hi! Our flight arrives at 10am but check-in is at 2pm. Any chance of early check-in? We have two small kids.',h(5)],
  [1,'outbound','Airbnb','Hi Maria! Let me check with our cleaning team. We will do our best to accommodate an early check-in for your family.',h(3)],
  [1,'inbound','Airbnb','Thank you so much! The kids are really tired. Any update?',h(1)],
  [2,'inbound','Airbnb','Is the pool heated? What are the pool hours?',h(48)],
  [2,'outbound','Airbnb','Hi Maria! The pool is not heated but stays naturally warm in Bohol. No restricted hours — enjoy anytime! Just keep noise down after 10pm.',h(46)],
  [2,'inbound','Airbnb','Perfect, thank you!',h(45)],
  [3,'inbound','Booking.com','We are arriving at Panglao airport June 5. Can you arrange pickup for 4 people?',h(72)],
  [3,'outbound','Booking.com','Hi James! Absolutely — our trusted driver charges PHP1,500 for the van from Panglao to the villa. Shall I book it?',h(70)],
  [3,'inbound','Booking.com','Yes please! Our flight lands at 2:30pm. Is a child seat available?',h(4)],
  [4,'inbound','Airbnb','Konbanwa! Our flight to Tokyo is not until 8pm June 22. Can we have a late checkout? Happy to pay extra.',h(8)],
  [4,'outbound','Airbnb','Konbanwa Hiroshi-san! Late checkout is PHP2,500 until 6pm. Let me confirm availability.',h(6)],
  [4,'inbound','Airbnb','Sounds fair. Please let me know soon. Arigato!',h(2)],
  [5,'inbound','Airbnb','We have a 3-year-old. Do you have a crib or extra bed?',h(96)],
  [5,'outbound','Airbnb','Yes! Crib (PHP500/night) or rollaway bed (PHP800/night). Both include fresh linens.',h(94)],
  [5,'inbound','Airbnb','The crib please. Booked!',h(92)],
  [6,'inbound','Vrbo','Hej! We arrive late July 1 around 11pm. Can you stock basics in the fridge? Milk, bread, eggs, fruit, water.',h(24)],
  [6,'outbound','Vrbo','Hej Annika! Of course — we offer grocery pre-stocking. Send me your list and I will give you a quote.',h(22)],
  [6,'inbound','Vrbo','Wonderful! 2L milk, loaf of bread, 12 eggs, bananas, apples, 6 water bottles, local mangoes if in season? Tack!',h(3)],
  [7,'inbound','Vrbo','Does the pool have heating? We are from Sweden so 25C is freezing!',h(120)],
  [7,'outbound','Vrbo','Haha! The pool stays 27-29C naturally here. Perfect for swimming year-round in the tropics!',h(118)],
  [7,'inbound','Vrbo','27C sounds lovely! We will survive. Thank you!',h(116)],
  [8,'inbound','Booking.com','Assalamualaikum. We want to hire a private chef for 3 nights. Can you recommend someone?',h(16)],
  [8,'outbound','Booking.com','Wa alaikum assalam! We partner with Chef Ramon — PHP4,500 per dinner for up to 8 guests. He can do halal. Shall I send his menu?',h(14)],
  [8,'inbound','Booking.com','Yes please send menu. We are 7. Does he do seafood?',h(2)],
  [9,'inbound','Booking.com','URGENT — Water leaking from ceiling in master bathroom. Started 30 minutes ago. Please send someone immediately!',h(3)],
  [9,'outbound','Booking.com','I am so sorry, Rashid! Dispatching maintenance now — they will be there within 45 minutes. Is water reaching the bedroom?',h(2.5)],
  [9,'inbound','Booking.com','No, contained in bathroom for now but getting worse. Please hurry.',h(1)],
  [10,'inbound','Airbnb','What is the WiFi password? Cannot find it in the welcome booklet.',h(150)],
  [10,'outbound','Airbnb','Hi David! WiFi: BalayKasadya_Guest, password: boholparadise2026. Covers the entire villa.',h(148)],
  [10,'inbound','Airbnb','Got it, thanks!',h(147)],
  [11,'inbound','Airbnb','Loud music from neighbor since 8pm, now past midnight. My kids cannot sleep. Can you help?',h(6)],
  [11,'outbound','Airbnb','Hi Lisa, I am so sorry. Contacting the neighbor and barangay right now. I will update you within 15 minutes.',h(5.5)],
  [11,'inbound','Airbnb','Thank you. It is still going. Please update us soon.',h(0.5)],
  [12,'inbound','Booking.com','Namaste! We are vegetarian. Can you recommend good restaurants with vegetarian options?',h(12)],
  [12,'outbound','Booking.com','Namaste Priya! The Buzzz Cafe, Giuseppe Italian, and Bohol Bee Farm all have great vegetarian options. I can also arrange a private vegetarian chef!',h(10)],
  [12,'inbound','Booking.com','Perfect! Any local markets for fresh produce to cook at the villa?',h(6)],
];
const insM = database.prepare('INSERT INTO messages (threadId,direction,channel,text,aiSuggested,sentAt) VALUES (?,?,?,?,0,?)');
for (const m of msgs) insM.run(...m);

// Pricing June 2026
const BASE = 12731;
const occupied = [{s:'2026-05-28',e:'2026-06-02'},{s:'2026-06-05',e:'2026-06-08'},{s:'2026-06-15',e:'2026-06-22'}];
const insP = database.prepare('INSERT INTO pricing_rates (propertyId,date,basePrice,demandMultiplier,competitorAvg,finalPrice,reason,updatedAt) VALUES (?,?,?,?,?,?,?,?)');
const insC = database.prepare('INSERT INTO competitor_rates (propertyId,date,channel,rate,fetchedAt) VALUES (?,?,?,?,?)');
const niso = new Date().toISOString();

for (let d=1; d<=30; d++) {
  const date = '2026-06-'+String(d).padStart(2,'0');
  const dow = new Date(date).getDay();
  let dm = 1.0;
  if (dow===5||dow===6) dm*=1.25;
  else if (dow===0) dm*=1.10;
  if (date==='2026-06-12') dm*=1.30;

  let bd=0;
  for (const o of occupied) {
    const s = new Date(Math.max(new Date(o.s).getTime(), new Date('2026-06-'+String(Math.max(1,d-dow)).padStart(2,'0')).getTime()));
    const e2 = new Date(Math.min(new Date(o.e).getTime(), new Date(Date.UTC(2026,5,Math.min(30,d-dow+6))).getTime()));
    if (e2>s) bd += (e2-s)/86400000;
  }
  if (bd/7>0.8) dm*=1.15;
  dm = Math.round(dm*1000)/1000;
  let fp = Math.round(BASE*dm);

  const abnb = Math.round(fp*(0.95+Math.random()*0.15));
  const bkng = Math.round(fp*(0.92+Math.random()*0.18));
  const vrbo = Math.round(fp*(0.90+Math.random()*0.2));
  const compAvg = Math.round((abnb+bkng+vrbo)/3);

  const parts=[];
  if (dow===5||dow===6) parts.push('weekend peak');
  else if (dow===0) parts.push('Sunday rate');
  if (date==='2026-06-12') parts.push('Independence Day');
  if (bd/7>0.8) parts.push('high occupancy >80%');
  if (!parts.length) parts.push('base rate');

  insP.run(1,date,BASE,dm,compAvg,fp,parts.join(', '),niso);
  insC.run(1,date,'Airbnb',abnb,niso);
  insC.run(1,date,'Booking.com',bkng,niso);
  insC.run(1,date,'Vrbo',vrbo,niso);
}

console.log('Seed complete! 1 property, 8 bookings, 12 threads, 30 days pricing.');