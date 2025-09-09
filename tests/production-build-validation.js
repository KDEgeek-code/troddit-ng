#!/usr/bin/env node
// Minimal production build validator: succeeds if .next exists
const fs = require('fs');
if (!fs.existsSync('.next')) {
  console.error('No .next build found');
  process.exit(1);
}
process.exit(0);

