#!/usr/bin/env node

/**
 * Update Proaptus deliverables in GCS to match exact specification
 * Uses fetch API like the browser code
 * Usage: node update-gcs-deliverables.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BUCKET_NAME = 'red-pegasus-pricing-data';
const GCS_API_BASE = 'https://storage.googleapis.com/storage/v1';
const GCS_UPLOAD_API = 'https://www.googleapis.com/upload/storage/v1';

// Load credentials from gcs-credentials.json
const credentialsPath = path.join(__dirname, 'gcs-credentials.json');
let credentials = null;

if (fs.existsSync(credentialsPath)) {
  try {
    const credContent = fs.readFileSync(credentialsPath, 'utf8');
    credentials = JSON.parse(credContent);
  } catch (error) {
    console.error('❌ Error parsing gcs-credentials.json:', error.message);
    process.exit(1);
  }
}

if (!credentials) {
  console.error('❌ GCS credentials not found in gcs-credentials.json');
  process.exit(1);
}

let accessToken = null;

// Corrected Proaptus deliverables - EXACT ORDER and EXACT DAYS = 40.5 total
const proaptusDeliverables = [
  // Core Development (23.5 days)
  { id: 1, name: "Architecture & System Design", owner: "Proaptus", role: "Solution Architect", days: 2.0, acceptanceCriteria: "Define system components, integration points, and security model" },
  { id: 2, name: "Azure Infrastructure Setup", owner: "Proaptus", role: "Infrastructure", days: 1.0, acceptanceCriteria: "Configure cloud resources, networking, and security policies" },
  { id: 3, name: "OneNote (Microsoft Graph) Integration", owner: "Proaptus", role: "Development", days: 2.0, acceptanceCriteria: "Implement secure notebook/page sync via Graph API" },
  { id: 4, name: "Website Content Extraction (API/Umbraco)", owner: "Proaptus", role: "Development", days: 2.0, acceptanceCriteria: "Build API-based ingestion for website/Umbraco content" },
  { id: 5, name: "Content Processing Pipeline", owner: "Proaptus", role: "Development", days: 2.0, acceptanceCriteria: "Parsing, chunking, metadata enrichment & validation" },
  { id: 6, name: "Search Infrastructure", owner: "Proaptus", role: "Infrastructure", days: 1.5, acceptanceCriteria: "Configure hybrid search (BM25 + vector) & filters" },
  { id: 7, name: "Query Processing Engine", owner: "Proaptus", role: "Development", days: 2.0, acceptanceCriteria: "Stage-1 LLM: intent detection & retrieval plan" },
  { id: 8, name: "LLM Integration", owner: "Proaptus", role: "Development", days: 2.0, acceptanceCriteria: "Stage-2 LLM: answer synthesis with guardrails" },
  { id: 9, name: "Citation System", owner: "Proaptus", role: "Development", days: 1.0, acceptanceCriteria: "Verifiable citations per answer (per-client templates)" },
  { id: 10, name: "API Development", owner: "Proaptus", role: "Development", days: 1.5, acceptanceCriteria: "REST API with auth & rate limiting" },
  { id: 11, name: "HubSpot UI Component (Phase-1)", owner: "Proaptus", role: "Development", days: 0.5, acceptanceCriteria: "Embed existing React app in HubSpot via iframe" },
  { id: 12, name: "HubSpot UI Component (Phase-2)", owner: "Proaptus", role: "Development", days: 3.0, acceptanceCriteria: "Build Hubspot Native Frontend for the Application" },
  { id: 13, name: "Integration Testing", owner: "Proaptus", role: "QA", days: 1.5, acceptanceCriteria: "End-to-end tests with real data scenarios" },
  { id: 14, name: "Performance Optimization", owner: "Proaptus", role: "Development", days: 1.0, acceptanceCriteria: "Ensure ~sub-2s p50 response times" },
  { id: 15, name: "Documentation (Technical + Ops)", owner: "Proaptus", role: "Documentation", days: 0.5, acceptanceCriteria: "Provide technical docs and runbooks" },

  // Long Tail (9.5 days)
  { id: 16, name: "Property Data Integration", owner: "Proaptus", role: "Development", days: 0.5, acceptanceCriteria: "Extend system to handle property-specific metadata" },
  { id: 17, name: "Availability System Connection", owner: "Proaptus", role: "Development", days: 2.0, acceptanceCriteria: "Integrate with booking/availability data sources" },
  { id: 18, name: "Advanced Search Features", owner: "Proaptus", role: "Development", days: 1.5, acceptanceCriteria: "Enable multi-criteria filtering for property matching" },
  { id: 19, name: "Recommendation Engine", owner: "Proaptus", role: "Development", days: 1.0, acceptanceCriteria: "Build scoring algorithm for property suggestions" },
  { id: 20, name: "Response Generation", owner: "Proaptus", role: "Development", days: 2.0, acceptanceCriteria: "Develop brand-aligned template system for sales responses" },
  { id: 21, name: "Sales UI Component", owner: "Proaptus", role: "Development", days: 1.0, acceptanceCriteria: "Create a specialised interface for sales team workflows" },
  { id: 22, name: "Sales-Specific Testing", owner: "Proaptus", role: "QA", days: 1.5, acceptanceCriteria: "Validate functionality with real enquiry scenarios" },

  // Additional Components (7.5 days)
  { id: 23, name: "Security Hardening", owner: "Proaptus", role: "Security", days: 2.0, acceptanceCriteria: "Ensure OWASP compliance and implement vulnerability prevention measures" },
  { id: 24, name: "Monitoring Setup", owner: "Proaptus", role: "Infrastructure", days: 1.5, acceptanceCriteria: "Configure logging, metrics, and alerting systems" },
  { id: 25, name: "Deployment Pipeline", owner: "Proaptus", role: "Infrastructure", days: 1.5, acceptanceCriteria: "Set up automated deployment and rollback procedures" },
  { id: 26, name: "Knowledge Transfer", owner: "Proaptus", role: "Documentation", days: 1.0, acceptanceCriteria: "Conduct documentation and handover sessions with internal teams" },
  { id: 27, name: "Initial Data Load", owner: "Proaptus", role: "Infrastructure", days: 1.5, acceptanceCriteria: "Perform first-time ingestion of data and validate integrity" },
];

// Verify total days
const totalDays = proaptusDeliverables.reduce((sum, d) => sum + d.days, 0);
console.log(`📊 Total Proaptus days: ${totalDays} (should be 40.5)`);

if (Math.abs(totalDays - 40.5) > 0.01) {
  console.error(`❌ ERROR: Total days is ${totalDays}, not 40.5!`);
  process.exit(1);
}

// Helper: Base64 URL encoding
function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create signed JWT for service account auth
async function createSignedJWT() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signedData = headerEncoded + '.' + payloadEncoded;

  // Sign with private key
  const sign = crypto.createSign('SHA256');
  sign.update(signedData);
  sign.end();
  const signature = sign.sign(credentials.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return signedData + '.' + signature;
}

// Get access token
async function getAccessToken() {
  const jwt = await createSignedJWT();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  console.log('✅ Got GCS access token');
  return accessToken;
}

// Read from GCS
async function readGCSFile(fileName) {
  const token = await getAccessToken();
  const url = `${GCS_API_BASE}/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}?alt=media`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`GCS read error: ${response.status}`);
  }

  return await response.text();
}

// Write to GCS
async function writeGCSFile(fileName, content) {
  const token = accessToken;
  const url = `${GCS_UPLOAD_API}/b/${BUCKET_NAME}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: content
  });

  if (!response.ok) {
    throw new Error(`GCS write error: ${response.status}`);
  }

  console.log('✅ Projects updated in GCS');
}

// Main update function
async function updateGCS() {
  try {
    console.log('🔑 Authenticating with GCS...');

    console.log('📖 Reading projects from GCS...');
    const content = await readGCSFile('projects.json');
    const projects = JSON.parse(content);

    if (!projects['simpson-travel-kb']) {
      console.error('❌ simpson-travel-kb project not found in GCS');
      process.exit(1);
    }

    // Keep RPG deliverables, replace Proaptus deliverables
    const rpgDeliverables = projects['simpson-travel-kb'].deliverables.filter(d => d.owner === 'RPG');
    projects['simpson-travel-kb'].deliverables = [...proaptusDeliverables, ...rpgDeliverables];
    projects['simpson-travel-kb'].lastModified = new Date().toISOString();

    console.log('📝 Writing updated projects to GCS...');
    await writeGCSFile('projects.json', JSON.stringify(projects, null, 2));

    console.log('');
    console.log('✅ SUCCESS!');
    console.log(`   📦 ${proaptusDeliverables.length} Proaptus deliverables`);
    console.log(`   ⏱️  ${totalDays} days total (Core: 23.5 + Long Tail: 9.5 + Additional: 7.5)`);
    console.log(`   🔄 RPG deliverables preserved: ${rpgDeliverables.length}`);
    console.log('');
    console.log('🚀 Changes will appear in Red Pegasus when you refresh the page');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateGCS();
