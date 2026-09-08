import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);

/** Explicit read-only operator mode. Reuses Wrangler OAuth; never extracts tokens. */
export function openWranglerDb() {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error('Set CLOUDFLARE_ACCOUNT_ID explicitly for --wrangler');
  return {
    async execute(stmt) {
      const sql = typeof stmt === 'string' ? stmt : stmt.sql;
      if (!/^\s*(?:SELECT|WITH)\b/i.test(sql) || (typeof stmt !== 'string' && stmt.args?.length)) {
        throw new Error('--wrangler generator mode accepts fixed, parameter-free read queries only');
      }
      // --file is D1's import path and does not return SELECT rows. execFile
      // passes fixed SQL directly as an argument; no shell or credentials.
      const { stdout } = await exec(process.execPath, [resolve('node_modules/wrangler/bin/wrangler.js'),
        'd1', 'execute', 'dshfind', '--remote', '--command', sql, '--json'], { maxBuffer: 64 * 1024 * 1024 });
      const result = JSON.parse(stdout)[0];
      if (!result?.success) throw new Error('D1 generator query failed');
      return { rows: result.results, meta: result.meta };
    },
  };
}
