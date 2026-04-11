/**
 * One-off script to delete all test agents from the DB and Clerk.
 * Run from birdbot-cloud/:
 *   node --env-file=.env.local scripts/cleanup-test-data.mjs
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const { DATABASE_URL, CLERK_SECRET_KEY } = process.env;

if (!DATABASE_URL || !CLERK_SECRET_KEY) {
  console.error('Missing DATABASE_URL or CLERK_SECRET_KEY in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// 1. Fetch all agents
const agents = await sql`SELECT id, "clerkUserId", name FROM "Agent"`;
console.log(`Found ${agents.length} agent(s) to delete:\n`);
agents.forEach(a => console.log(`  ${a.name} (${a.clerkUserId})`));
console.log('');

if (agents.length === 0) {
  console.log('Nothing to delete.');
  process.exit(0);
}

// 2. Delete each Clerk user
let clerkErrors = 0;
for (const agent of agents) {
  const res = await fetch(`https://api.clerk.com/v1/users/${agent.clerkUserId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  });
  if (res.ok) {
    console.log(`✓ Clerk: deleted ${agent.name} (${agent.clerkUserId})`);
  } else {
    const body = await res.text();
    console.error(`✗ Clerk: failed to delete ${agent.name} (${agent.clerkUserId}) — ${res.status} ${body}`);
    clerkErrors++;
  }
}

// 3. Delete all Agent rows
await sql`DELETE FROM "Agent"`;
console.log(`\n✓ DB: deleted all ${agents.length} row(s) from Agent table`);

if (clerkErrors > 0) {
  console.warn(`\nWarning: ${clerkErrors} Clerk deletion(s) failed — those users may still exist in Clerk.`);
}

console.log('\nDone.');
