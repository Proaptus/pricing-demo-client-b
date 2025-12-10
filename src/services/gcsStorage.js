/**
 * Direct Google Cloud Storage access from browser
 * Uses GCS JSON API with signed requests
 */

const BUCKET_NAME = 'red-pegasus-pricing-data';
const GCS_API_BASE = 'https://storage.googleapis.com/storage/v1';
const GCS_UPLOAD_API = 'https://www.googleapis.com/upload/storage/v1';
const BACKUP_FOLDER = 'backups/projects';
const MAX_BACKUPS = 20;

// Service account credentials (loaded from environment)
let credentials = null;
let accessToken = null;
let tokenExpiry = null;

/**
 * Initialize with service account credentials
 */
export async function initializeGCS(credentialsJson) {
  credentials = credentialsJson;
  console.log('📦 GCS initialized with service account:', credentials.client_email);
}

/**
 * Get valid access token (with caching and refresh)
 */
async function getAccessToken() {
  const now = Date.now();
  if (accessToken && tokenExpiry && tokenExpiry > now) {
    return accessToken; // Token still valid
  }

  if (!credentials) {
    throw new Error('GCS credentials not initialized. Call initializeGCS() first.');
  }

  // Create a signed JWT and exchange it for an access token
  const jwt = await createSignedJWT(credentials);
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('❌ OAuth2 error response:', errorText);
    throw new Error('Failed to get access token: ' + tokenResponse.statusText + ' - ' + errorText);
  }

  const tokenData = await tokenResponse.json();
  accessToken = tokenData.access_token;
  tokenExpiry = now + (tokenData.expires_in * 1000 * 0.9); // Refresh 90% through expiry

  console.log('✅ Got GCS access token (expires in ' + tokenData.expires_in + 's)');
  return accessToken;
}

/**
 * Create a signed JWT for service account authentication
 * Uses RSA-SHA256 signing via Web Crypto API
 */
async function createSignedJWT(creds) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));

  const signedData = headerEncoded + '.' + payloadEncoded;

  // Sign with RSA private key
  return await signJWTWithKey(signedData, creds.private_key);
}

/**
 * Base64 URL encoding helper
 */
function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Sign JWT with private key using Web Crypto API
 */
async function signJWTWithKey(data, privateKeyPem) {
  try {
    // Extract the actual key content from PEM format
    const keyContent = privateKeyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');

    // Convert base64 to Uint8Array
    const keyBuffer = new Uint8Array(
      atob(keyContent)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    // Import the key for signing
    const cryptoKey = await window.crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );

    // Sign the data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const signatureBuffer = await window.crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      dataBuffer
    );

    // Convert signature to base64url
    const signatureArray = new Uint8Array(signatureBuffer);
    let signatureBase64 = '';
    for (let i = 0; i < signatureArray.length; i++) {
      signatureBase64 += String.fromCharCode(signatureArray[i]);
    }
    const signatureBase64Url = btoa(signatureBase64)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return data + '.' + signatureBase64Url;
  } catch (error) {
    console.error('❌ JWT signing error:', error);
    throw new Error('Failed to sign JWT: ' + error.message);
  }
}

/**
 * Load projects from GCS
 */
export async function loadProjectsFromGCS() {
  try {
    console.log('📥 Loading projects from GCS...');
    const data = await readGCSFile('projects.json');
    const projects = JSON.parse(data);
    console.log('✅ Projects loaded:', Object.keys(projects).length);
    return projects;
  } catch (error) {
    if (error.message.includes('404')) {
      console.log('ℹ️ No projects file found - starting fresh');
      return {};
    }
    console.error('❌ Error loading projects:', error);
    return {};
  }
}

/**
 * Load role weights from GCS
 */
export async function loadRoleWeightsFromGCS() {
  try {
    console.log('📥 Loading role weights from GCS...');
    const data = await readGCSFile('role-weights.json');
    let weights = JSON.parse(data);

    // Handle corrupted format: if weights has 'weights', 'reason', 'comment', 'updatedAt' properties
    // it's in the old incorrect format. Convert it to correct format.
    if (weights.weights && !weights.current) {
      console.log('⚠️ Detected corrupted role weights format - converting...');
      weights = {
        current: weights.weights,
        lastChanged: {
          date: weights.updatedAt || new Date().toISOString(),
          reason: weights.reason || 'Format migration',
          comment: weights.comment || 'Auto-fixed corrupted format'
        }
      };
      console.log('✅ Role weights converted from corrupted format');
    }

    console.log('✅ Role weights loaded');
    return weights;
  } catch (error) {
    if (error.message.includes('404')) {
      console.log('ℹ️ No role weights file found - using defaults');
      return {
        current: {
          'Solution Architect': 1.2,
          'Project Management': 1.1,
          'Development': 1.0,
          'QA': 0.95,
          'Junior': 0.85
        },
        lastChanged: {
          date: new Date().toISOString(),
          reason: 'Initial setup',
          comment: 'Default role weights'
        }
      };
    }
    console.error('❌ Error loading role weights:', error);
    return null;
  }
}

/**
 * Save projects to GCS with automatic backup
 */
export async function saveProjectsToGCS(projects) {
  try {
    console.log('📤 Saving projects to GCS...');
    const data = JSON.stringify(projects, null, 2);

    // Save current version
    await writeGCSFile('projects.json', data, 'application/json');

    // Create timestamped backup
    await createProjectBackup(projects);

    console.log('✅ Projects saved (with backup)');
  } catch (error) {
    console.error('❌ Error saving projects:', error);
    throw error;
  }
}

/**
 * Create a timestamped backup of projects
 */
async function createProjectBackup(projects) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `${BACKUP_FOLDER}/${timestamp}-projects.json`;
    const data = JSON.stringify(projects, null, 2);

    console.log('💾 Creating backup:', backupFileName);
    await writeGCSFile(backupFileName, data, 'application/json');

    // Clean up old backups to stay under limit
    await cleanOldBackups();
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    // Don't throw - backup failure shouldn't block the save
  }
}

/**
 * List all project backups
 */
export async function listProjectBackups() {
  try {
    console.log('📋 Listing project backups...');
    const token = await getAccessToken();
    const url = `${GCS_API_BASE}/b/${BUCKET_NAME}/o?prefix=${encodeURIComponent(BACKUP_FOLDER + '/')}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`GCS list error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const backups = (result.items || [])
      .filter(item => item.name.endsWith('-projects.json'))
      .sort((a, b) => b.timeCreated.localeCompare(a.timeCreated))
      .map(item => ({
        fileName: item.name.split('/').pop(),
        timestamp: item.timeCreated,
        size: parseInt(item.size || 0),
        url: item.name
      }));

    console.log(`✅ Found ${backups.length} backups`);
    return backups;
  } catch (error) {
    console.error('❌ Error listing backups:', error);
    return [];
  }
}

/**
 * Restore projects from a specific backup
 */
export async function restoreProjectFromBackup(backupUrl) {
  try {
    console.log('🔄 Restoring from backup:', backupUrl);
    const data = await readGCSFile(backupUrl);
    const projects = JSON.parse(data);

    // Save the restored version as current
    await saveProjectsToGCS(projects);

    console.log('✅ Projects restored from backup');
    return projects;
  } catch (error) {
    console.error('❌ Error restoring from backup:', error);
    throw error;
  }
}

/**
 * Delete old backups to stay under limit
 */
async function cleanOldBackups() {
  try {
    const backups = await listProjectBackups();

    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS);
      console.log(`🗑️ Cleaning up ${toDelete.length} old backups (keeping last ${MAX_BACKUPS})`);

      for (const backup of toDelete) {
        await deleteGCSFile(backup.url);
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error);
    // Don't throw - cleanup failure shouldn't block operations
  }
}

/**
 * Save role weights to GCS
 */
export async function saveRoleWeightsToGCS(roleWeights) {
  try {
    console.log('📤 Saving role weights to GCS...');
    const data = JSON.stringify(roleWeights, null, 2);
    await writeGCSFile('role-weights.json', data, 'application/json');
    console.log('✅ Role weights saved');
  } catch (error) {
    console.error('❌ Error saving role weights:', error);
    throw error;
  }
}

/**
 * Read a file from GCS
 */
async function readGCSFile(fileName) {
  const token = await getAccessToken();
  const url = `${GCS_API_BASE}/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}?alt=media`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`GCS read error: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Write a file to GCS
 */
async function writeGCSFile(fileName, content, contentType = 'application/json') {
  const token = await getAccessToken();
  const url = `${GCS_UPLOAD_API}/b/${BUCKET_NAME}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType
    },
    body: content
  });

  if (!response.ok) {
    throw new Error(`GCS write error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete a file from GCS
 */
async function deleteGCSFile(fileName) {
  const token = await getAccessToken();
  const url = `${GCS_API_BASE}/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`GCS delete error: ${response.status} ${response.statusText}`);
  }

  return true;
}

export default {
  initializeGCS,
  loadProjectsFromGCS,
  loadRoleWeightsFromGCS,
  saveProjectsToGCS,
  saveRoleWeightsToGCS,
  listProjectBackups,
  restoreProjectFromBackup
};
