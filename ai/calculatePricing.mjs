const PH_HOLIDAYS = new Set(['2026-01-01','2026-04-09','2026-04-17','2026-05-01','2026-06-12','2026-08-21','2026-08-31','2026-11-30','2026-12-25','2026-12-30']);

export function calculatePricing(basePrice, date, occupancyRate, competitorAvg) {
  const jsDate = new Date(date + 'T00:00:00');
  const dow = jsDate.getDay();
  let mult = 1.0;
  const factors = [];
  if (dow === 5 || dow === 6) { mult *= 1.25; factors.push('weekend'); }
  else if (dow === 0) { mult *= 1.10; factors.push('Sun'); }
  if (PH_HOLIDAYS.has(date)) { mult *= 1.30; factors.push('holiday'); }
  if (occupancyRate && occupancyRate >= 0.80) { mult *= 1.15; factors.push('high occupancy'); }
  mult = Math.round(mult * 100) / 100;
  let finalPrice = Math.round(basePrice * mult);
  if (competitorAvg && competitorAvg > 0 && competitorAvg > finalPrice * 1.20) {
    finalPrice = Math.round(finalPrice * 1.05);
    factors.push('competitor+');
  }
  return { finalPrice, demandMultiplier: mult, reason: factors.length ? factors.join(', ') : 'standard rate' };
}
