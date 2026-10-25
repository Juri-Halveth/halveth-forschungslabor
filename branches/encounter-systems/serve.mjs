// SPDX-License-Identifier: MIT
// CI and the interactive local preview share one public-file-only server.
import path from 'node:path';
import { createPreview } from '../../scripts/serve-public-preview.mjs';
const port=Number(process.argv[2]||8849);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid local port');
const server=await createPreview(path.resolve(import.meta.dirname,'../..'));
server.listen(port,'127.0.0.1',()=>console.log(`Public research preview: http://127.0.0.1:${port}/`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
