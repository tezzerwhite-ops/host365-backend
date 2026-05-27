const PH_HOLIDAYS = ['2026-01-01','2026-04-09','2026-04-17','2026-05-01','2026-06-12','2026-08-21','2026-08-31','2026-11-30','2026-12-25','2026-12-30'];

function isFriSat(d) { return new Date(d).getDay()===5||new Date(d).getDay()===6; }
function isSun(d) { return new Date(d).getDay()===0; }
function isHoliday(d) { return PH_HOLIDAYS.includes(d); }
function weekStart(d) { const x = new Date(d); x.setDate(x.getDate()-x.getDay()); return x.toISOString().split('T')[0]; }

function calculatePricing(basePrice, date, bookings, compAvg) {
  let dm = 1.0;
  if (isFriSat(date)) dm *= 1.25;
  else if (isSun(date)) dm *= 1.10;
  if (isHoliday(date)) dm *= 1.30;
  const ws = weekStart(date);
  const we = new Date(new Date(ws).getTime()+7*86400000).toISOString().split('T')[0];
  let bd = 0;
  if (bookings && bookings.length) {
    for (const b of bookings) {
      const s = new Date(Math.max(new Date(b.checkin).getTime(), new Date(ws).getTime()));
      const e = new Date(Math.min(new Date(b.checkout).getTime(), new Date(we).getTime()));
      if (e>s) bd += Math.min(7,(e-s)/86400000);
    }
  }
  if (bd/7 > 0.8) dm *= 1.15;
  let fp = Math.round(basePrice*dm);
  if (compAvg&&compAvg>0&&compAvg/fp>1.20) { fp = Math.round(fp*1.08); dm = Math.round((fp/basePrice)*1000)/1000; }
  dm = Math.round(dm*1000)/1000;
  const parts=[];
  if (isFriSat(date)) parts.push('weekend peak');
  else if (isSun(date)) parts.push('Sunday rate');
  if (isHoliday(date)) parts.push('public holiday');
  if (bd/7>0.8) parts.push('high occupancy >80%');
  if (compAvg&&compAvg/fp>1.20) parts.push('competitor price gap');
  if (!parts.length) parts.push('base rate');
  return {demandMultiplier:dm,finalPrice:fp,reason:parts.join(', ')};
}

module.exports = {calculatePricing};