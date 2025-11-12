// utils/virusScanner.js
const { execFile } = require('child_process');

// Development-only bypass: set DISABLE_VIRUS_SCAN=true to skip scanning
const DEV_BYPASS = process.env.DISABLE_VIRUS_SCAN === 'true';

// Try optional dependency 'clamscan' if available
let nodeClam = null;
try {
  nodeClam = require('clamscan');
} catch (e) {
  nodeClam = null; // library not installed
}

async function scanWithNodeClam(filePath) {
  try {
    const ClamScan = await new nodeClam().init({
      removeInfected: false,
      debugMode: false,
    });
    const { isInfected, viruses } = await ClamScan.scanFile(filePath);
    return { ok: true, isInfected: !!isInfected, details: (viruses || []).join(', ') };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function scanWithCli(filePath) {
  return new Promise((resolve) => {
    execFile('clamscan', ['--no-summary', filePath], { windowsHide: true }, (error, stdout, stderr) => {
      if (error && error.code === 'ENOENT') {
        return resolve({ ok: false, error: 'ScannerUnavailable' });
      }
      if (error) {
        // Non-zero exit may indicate infected file; clamscan returns 1 when virus found
        const infected = error.code === 1;
        return resolve({ ok: true, isInfected: infected, details: stdout || stderr });
      }
      // Exit code 0 => clean
      resolve({ ok: true, isInfected: false, details: stdout });
    });
  });
}

async function scanFile(filePath) {
  // Allow development bypass for testing
  if (DEV_BYPASS) {
    return { ok: true, isInfected: false, details: 'Scan bypassed (DISABLE_VIRUS_SCAN=true)' };
  }

  // Prefer node-clam if available
  if (nodeClam) {
    const res = await scanWithNodeClam(filePath);
    if (res.ok) return res;
  }
  // Fallback to CLI
  const cliRes = await scanWithCli(filePath);
  return cliRes;
}

module.exports = { scanFile };