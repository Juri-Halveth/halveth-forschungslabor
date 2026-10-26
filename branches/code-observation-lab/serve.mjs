// SPDX-License-Identifier: MIT
import path from 'node:path';
import { createPreview } from '../../scripts/serve-public-preview.mjs';
if (process.argv.length !== 2) throw Error('Use: node branches/code-observation-lab/serve.mjs');
const server = await createPreview(path.resolve(import.meta.dirname, '../..'));
server.listen(8855, '127.0.0.1', () => console.log('Code & Messung: http://127.0.0.1:8855/code/ — lokale Vorschau der freigegebenen Dateien.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
