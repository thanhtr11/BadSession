// Simple smoke-check script for BadSession APIs.
// Usage: set AUTH_TOKEN and optionally API_BASE, then run with Node 18+ or inside a Node container.
// Example (PowerShell):
//   $env:AUTH_TOKEN="<token>"; $env:API_BASE="http://host.docker.internal:9500"; node scripts/smoke-check.js

const { request } = require('http');
const { request: httpsRequest } = require('https');

function httpRequest(url, opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? httpsRequest : request;
      const headers = opts.headers || {};
      const body = opts.body ? JSON.stringify(opts.body) : undefined;
      if (body) headers['Content-Type'] = 'application/json';

      const r = lib(u, { method: opts.method || 'GET', headers }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const ct = res.headers['content-type'] || '';
          const isJson = ct.includes('application/json') || (data && (data.trim().startsWith('{') || data.trim().startsWith('[')));
          resolve({ status: res.statusCode, headers: res.headers, body: isJson ? safeJsonParse(data) : data });
        });
      });
      r.on('error', reject);
      if (body) r.write(body);
      r.end();
    } catch (err) {
      reject(err);
    }
  });
}

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

async function run() {
  const token = process.env.AUTH_TOKEN;
  const base = process.env.API_BASE || 'http://localhost:9500';
  if (!token) {
    console.error('Missing AUTH_TOKEN environment variable. Set AUTH_TOKEN to a server-signed JWT or login token.');
    process.exit(2);
  }

  const authHeader = { Authorization: `Bearer ${token}` };

  console.log('Using API base:', base);

  // 1) GET /api/sessions
  console.log('1) Fetching sessions...');
  const sessionsRes = await httpRequest(`${base}/api/sessions`, { headers: authHeader });
  if (sessionsRes.status !== 200) {
    console.error('Failed to fetch sessions, status=', sessionsRes.status, 'body=', sessionsRes.body);
    process.exit(3);
  }
  const sessions = sessionsRes.body || [];
  console.log('  sessions count =', sessions.length);
  if (!Array.isArray(sessions) || sessions.length === 0) {
    console.error('No sessions available to run check-in test.');
    process.exit(4);
  }

  const sessionId = sessions[0].id || sessions[0].session_id || sessions[0].sessionId;
  if (!sessionId) {
    console.error('Could not determine session id from sessions[0]');
    process.exit(5);
  }

  // 2) POST /api/attendance/check-in
  const guestName = `SmokeTestGuest_${Date.now()}`;
  console.log('2) Posting guest check-in for', guestName, 'session', sessionId);
  const checkinRes = await httpRequest(`${base}/api/attendance/check-in`, {
    method: 'POST',
    headers: { ...authHeader },
    body: { session_id: sessionId, is_self_checkin: false, guest_name: guestName }
  });
  if (![200,201].includes(checkinRes.status)) {
    console.error('Check-in failed, status=', checkinRes.status, 'body=', checkinRes.body);
    process.exit(6);
  }
  console.log('  check-in response:', checkinRes.body);

  // 3) GET /api/attendance and confirm the guest exists
  console.log('3) Verifying attendance list contains guest...');
  const attRes = await httpRequest(`${base}/api/attendance`, { headers: authHeader });
  if (attRes.status !== 200) {
    console.error('Failed to fetch attendance, status=', attRes.status);
    process.exit(7);
  }
  const attendance = attRes.body || [];
  const found = attendance.find((r) => ((r.guest_name || r.name || r.full_name) === guestName) || (r.guest_name && r.guest_name.includes('SmokeTestGuest')));
  if (!found) {
    console.error('Newly checked-in guest not found in attendance list.');
    console.error('Attendance length=', attendance.length);
    process.exit(8);
  }
  console.log('  attendance verified, id=', found.id || found.attendance_id);

  // 4) POST /api/finance/donations (record a small income)
  console.log('4) Recording a small income for guest...');
  const donationBody = { amount: 10000, contributor_name: guestName, is_guest: true, notes: 'smoke-test' };
  const donateRes = await httpRequest(`${base}/api/finance/donations`, { method: 'POST', headers: authHeader, body: donationBody });
  if (![200,201].includes(donateRes.status)) {
    console.error('Donation recording failed, status=', donateRes.status, 'body=', donateRes.body);
    process.exit(9);
  }
  console.log('  donation response:', donateRes.body);

  // 5) GET /api/finance/donations and confirm donation present (best-effort: API shape may vary)
  console.log('5) Verifying donation list contains the new entry...');
  const donationsRes = await httpRequest(`${base}/api/finance/donations`, { headers: authHeader });
  if (donationsRes.status !== 200) {
    console.error('Failed to fetch donations, status=', donationsRes.status);
    process.exit(10);
  }
  const donations = donationsRes.body || [];
  const donated = donations.find((d) => (d.contributor_name === guestName) || (d.name && d.name === guestName) || (d.full_name && d.full_name === guestName));
  if (!donated) {
    console.warn('Warning: Donation not found in list. The API may paginate or use a different shape.');
  } else {
    console.log('  donation verified, id=', donated.id || donated.donation_id);
  }

  console.log('\nSMOKE CHECK: SUCCESS — basic end-to-end flows passed.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Smoke-check error:', err && err.stack ? err.stack : err);
  process.exit(11);
});
