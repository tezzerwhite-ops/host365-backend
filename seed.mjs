export function seedDb(db) {
  console.log('Seeding database...');
  db.prepare("INSERT INTO properties (id,name,location,bedrooms,maxGuests,basePrice,airbnbId,bookingComId,vrboId,imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?)").run(1,'Balay Kasadya Villa','Baclayon, Bohol, Philippines',5,10,12731,'684301631777591176','balay-kasadya-bohol','balay-kasadya-vrbo','https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800');

  const bookings=[[1,'Maria Santos','airbnb','2026-05-15','2026-05-20',8,63700,'confirmed'],[1,'John & Lisa Chen','airbnb','2026-06-10','2026-06-14',4,50924,'confirmed'],[1,'Takeshi Yamamoto','booking','2026-06-18','2026-06-25',6,89117,'confirmed'],[1,'Sofia Reyes','airbnb','2026-07-02','2026-07-09',10,140041,'confirmed'],[1,'Hans Mueller','vrbo','2026-07-20','2026-07-27',8,89000,'confirmed'],[1,'Sarah & Tom Parker','booking','2026-08-05','2026-08-12',6,89117,'confirmed'],[1,'Andrea Garcia','airbnb','2026-09-15','2026-09-22',10,127310,'confirmed'],[1,'David Kim','booking','2026-10-01','2026-10-05',4,50924,'confirmed']];
  const insB=db.prepare('INSERT INTO bookings (propertyId,guestName,channel,checkin,checkout,guests,totalRevenue,status) VALUES (?,?,?,?,?,?,?,?)');
  for(const b of bookings) insB.run(...b);

  const threads=[[1,2,'John Chen','airbnb','Check-in instructions for June 10','open','normal','pre-checkin','2026-06-08T10:30:00','2026-06-08T10:30:00'],[1,2,'John Chen','airbnb','What time can we check in?','open','urgent','pre-checkin','2026-06-09T07:15:00','2026-06-09T07:15:00'],[1,3,'Takeshi Yamamoto','booking','Is the pool heated?','resolved','normal','general','2026-06-16T14:00:00','2026-06-17T09:00:00'],[1,3,'Takeshi Yamamoto','booking','Late checkout request','open','normal','pre-checkin','2026-06-20T18:45:00','2026-06-20T18:45:00'],[1,4,'Sofia Reyes','airbnb','Arrival dinner recommendations','open','normal','upsell','2026-06-28T11:20:00','2026-06-28T11:20:00'],[1,4,'Sofia Reyes','airbnb','Leak in master bathroom!','open','urgent','damage','2026-07-03T20:10:00','2026-07-03T20:10:00'],[1,5,'Hans Mueller','vrbo','Wi-Fi password not working','open','normal','general','2026-07-21T09:30:00','2026-07-21T09:30:00'],[1,5,'Hans Mueller','vrbo','Noise complaint from neighbours','open','urgent','complaint','2026-07-23T23:00:00','2026-07-23T23:00:00'],[1,6,'Sarah Parker','booking','Can we bring our dog?','resolved','low','general','2026-08-01T15:00:00','2026-08-02T10:00:00'],[1,6,'Sarah Parker','booking','Early check-in possible?','open','normal','pre-checkin','2026-08-04T08:00:00','2026-08-04T08:00:00'],[1,7,'Andrea Garcia','airbnb','Boat tour booking help','open','normal','upsell','2026-09-10T16:30:00','2026-09-10T16:30:00'],[1,7,'Andrea Garcia','airbnb','AC not cooling in bedroom 3','open','normal','damage','2026-09-18T14:00:00','2026-09-18T14:00:00']];
  const insT=db.prepare('INSERT INTO threads (propertyId,bookingId,guestName,channel,subject,status,priority,aiCategory,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)');
  for(const t of threads) insT.run(...t);

  const messages=[[1,'inbound','airbnb','Hi! We are arriving on June 10 and wanted to confirm the check-in process. Can you send the door code?',0,'2026-06-08T10:30:00'],[1,'outbound','airbnb','Hello John! Your door code is 8842#. Check-in is from 3 PM. The caretaker will meet you with the keys. Enjoy your stay!',0,'2026-06-08T11:00:00'],[2,'inbound','airbnb','Hi again - what time can we actually check in? Our flight lands at 11 AM and we have our kids with us.',0,'2026-06-09T07:15:00'],[3,'inbound','booking','Hello, is the swimming pool heated? We are visiting in June.',0,'2026-06-16T14:00:00'],[3,'outbound','booking','Hi Takeshi! The pool is not heated but June temperatures keep it naturally warm - about 28C. Perfect for swimming!',0,'2026-06-17T09:00:00'],[4,'inbound','booking','Would it be possible to have a late checkout on the 25th? Our flight is not until 5 PM.',0,'2026-06-20T18:45:00'],[5,'inbound','airbnb','Hi! We arrive July 2 and would love dinner recommendations nearby. Anything special for a family of 10?',0,'2026-06-28T11:20:00'],[6,'inbound','airbnb','There is water leaking from the ceiling in the master bathroom! It started 30 minutes ago. We are worried about damage.',0,'2026-07-03T20:10:00'],[7,'inbound','vrbo','The Wi-Fi password from the manual is not working. Can you send the correct one?',0,'2026-07-21T09:30:00'],[8,'inbound','vrbo','We received a complaint from the neighbour about noise. We were just having a family dinner. What should we do?',0,'2026-07-23T23:00:00'],[9,'inbound','booking','We are thinking of bringing our golden retriever. Are pets allowed?',0,'2026-08-01T15:00:00'],[9,'outbound','booking','Hi Sarah! Unfortunately we have a no-pets policy due to guest allergies. We can recommend a nearby pet boarding service if that helps!',0,'2026-08-02T10:00:00'],[10,'inbound','booking','Can we check in early on August 5? Our bus from Cebu arrives at 10 AM.',0,'2026-08-04T08:00:00'],[11,'inbound','airbnb','We want to book a dolphin-watching boat tour. Can you help arrange this for our group of 10?',0,'2026-09-10T16:30:00'],[12,'inbound','airbnb','The AC in bedroom 3 is not cooling properly - it just blows room-temperature air. Can someone check it?',0,'2026-09-18T14:00:00']];
  const insM=db.prepare('INSERT INTO messages (threadId,direction,channel,text,aiSuggested,sentAt) VALUES (?,?,?,?,?,?)');
  for(const m of messages) insM.run(...m);

  const insR=db.prepare('INSERT OR REPLACE INTO pricing_rates (propertyId,date,basePrice,demandMultiplier,competitorAvg,finalPrice,reason,updatedAt) VALUES (?,?,?,?,?,?,?,?)');
  const insCR=db.prepare('INSERT OR REPLACE INTO competitor_rates (propertyId,date,channel,rate,fetchedAt) VALUES (?,?,?,?,?)');
  const dn=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const hol=new Set(['2026-06-12']);
  for(let d=1;d<=30;d++){
    const dd=String(d).padStart(2,'0'),date='2026-06-'+dd;
    const js=new Date(2026,5,d),day=dn[js.getDay()];
    let mult=1.0,reason='Standard rate';
    if(day==='Friday'||day==='Saturday'){mult*=1.25;reason='Weekend pricing';}
    else if(day==='Sunday'){mult*=1.10;reason='Weekend pricing (Sun)';}
    if(hol.has(date)){mult*=1.30;reason='Independence Day';}
    if(d>=10&&d<=14){mult*=1.15;reason=reason==='Standard rate'?'High occupancy':reason+' + high occupancy';}
    if(d>=18&&d<=25){mult*=1.10;reason=reason==='Standard rate'?'High occupancy':reason+' + high occupancy';}
    mult=Math.round(mult*100)/100;
    const fp=Math.round(12731*mult),ca=Math.round(fp*(0.95+Math.random()*0.15)),ts=date+'T00:00:00';
    insR.run([1,date,12731,mult,ca,fp,reason,ts]);
    const isWk=day==='Friday'||day==='Saturday'||day==='Sunday',isH=hol.has(date);
    const bc=isH?16500:isWk?14500:12500;
    const vr=Math.floor(Math.random()*2000)-1000;
    insCR.run([1,date,'airbnb',bc+vr,ts]);
    insCR.run([1,date,'booking',bc+vr+300,ts]);
    insCR.run([1,date,'vrbo',bc+vr-200,ts]);
  }
  console.log('Seed complete');
}
