const https = require('http');

const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';  // User with fee data

// Calculate Weekly periods (same logic as PeriodSelector.tsx)
function getPSTToday() {
  const now = new Date();
  const pstTime = new Date(now.getTime() - 8 * 60 * 60 * 1000);
  return {
    year: pstTime.getUTCFullYear(),
    month: pstTime.getUTCMonth(),
    day: pstTime.getUTCDate()
  };
}

function createPSTDate(year, month, day) {
  return new Date(Date.UTC(year, month, day));
}

function addDays(date, days) {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

const pst = getPSTToday();
const today = createPSTDate(pst.year, pst.month, pst.day);
const todayDayOfWeek = today.getUTCDay();

// This Week (Sun-Today)
const thisWeekStart = addDays(today, -todayDayOfWeek);
const thisWeekEnd = today;

// Last Week (Sun-Sat)
const lastWeekEnd = addDays(today, -todayDayOfWeek - 1);
const lastWeekStart = addDays(lastWeekEnd, -6);

// 2 Weeks Ago
const twoWeeksAgoEnd = addDays(today, -todayDayOfWeek - 8);
const twoWeeksAgoStart = addDays(twoWeeksAgoEnd, -6);

// 4 Weeks Ago
const fourWeeksAgoEnd = addDays(today, -todayDayOfWeek - 22);
const fourWeeksAgoStart = addDays(fourWeeksAgoEnd, -6);

const periods = [
  { label: 'This Week', startDate: thisWeekStart.toISOString().split('T')[0], endDate: thisWeekEnd.toISOString().split('T')[0] },
  { label: 'Last Week', startDate: lastWeekStart.toISOString().split('T')[0], endDate: lastWeekEnd.toISOString().split('T')[0] },
  { label: '2 Weeks Ago', startDate: twoWeeksAgoStart.toISOString().split('T')[0], endDate: twoWeeksAgoEnd.toISOString().split('T')[0] },
  { label: '4 Weeks Ago', startDate: fourWeeksAgoStart.toISOString().split('T')[0], endDate: fourWeeksAgoEnd.toISOString().split('T')[0] },
];

console.log('Weekly Period Dates:');
for (const p of periods) {
  console.log(`  ${p.label}: ${p.startDate} to ${p.endDate}`);
}

const data = JSON.stringify({ userId, periods });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/dashboard/metrics',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('\nCalling API...');

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log('\n=== API Response ===');
      console.log('Success:', json.success);

      if (json.metrics) {
        for (const [label, data] of Object.entries(json.metrics)) {
          console.log(`\n${label}:`);
          console.log(`  Orders: ${data.orders}`);
          console.log(`  Sales: $${data.sales?.toFixed(2) || 0}`);
          console.log(`  Amazon Fees: $${data.amazonFees?.toFixed(2) || 0}`);
          console.log(`  Fee Source: ${data.feeSource || 'unknown'}`);
        }
      }

      if (json._debug) {
        console.log('\n=== Debug Info ===');
        for (const [label, debug] of Object.entries(json._debug)) {
          console.log(`\n${label} debug:`);
          console.log(`  PST Range: ${debug.pstStartUTC} to ${debug.pstEndUTC}`);
          console.log(`  Fee Data: $${debug.feeData?.totalFees?.toFixed(2) || 0} (${debug.feeData?.feeSource || 'unknown'})`);
          console.log(`  Order Count: ${debug.feeData?.orderCount || 0}`);
        }
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Raw response:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();
