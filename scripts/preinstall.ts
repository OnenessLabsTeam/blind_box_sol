#!/usr/bin/env node

import fs from 'node:fs';

const packageManager = process.env.npm_config_user_agent;

if (!packageManager || !packageManager.includes('pnpm')) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: dependency must be installed using pnpm. If pnpm is not installed, run `pnpm install` after `npm install-g pnpm`'); // Red color

  if (fs.existsSync('node_modules')) fs.rmSync('node_modules', { recursive: true });
  process.exit(1);
}