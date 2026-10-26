import fs from 'node:fs/promises';
// Owned CLI validation fixture: if validation regresses, stop before any path I/O.
fs.lstat=async()=>{throw new Error('I/O_TRIPWIRE_BEFORE_PATH_VALIDATION');};
