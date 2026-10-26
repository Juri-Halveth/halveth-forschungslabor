import {parentPort} from 'node:worker_threads';
globalThis.self={postMessage:message=>parentPort.postMessage(message),addEventListener(type,callback){if(type==='message')parentPort.on('message',data=>callback({data}));}};
await import('../../world-worker.mjs');
