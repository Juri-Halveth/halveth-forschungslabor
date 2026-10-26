// SPDX-License-Identifier: MIT
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { inspectFormat, encodeSymbolText, translateRna, interference, compareStateModels, simulateCameraCommand, weakDeflection, photonEnergy, aperture, LAB_VERSION } from './model.mjs';
export function demonstration() {
  const command = { requestId: 'CAMERA_DEMO', frame: 'WORLD_Y_UP', unit: 'm', camera: [0,1,0], target: [2,1,4] };
  return {
    schema: 'halveth.code-observation-lab.demo.v1', version: LAB_VERSION,
    format: inspectFormat('MAV.ETH', '42 41 41 4D'),
    symbols: encodeSymbolText('Licht 🧬', 5),
    rna: translateRna('AUGGCUUAA'),
    interference: { coherent: interference(1,0), phaseAveraged: interference(1,0,false,3) },
    stateBridge: { identity: compareStateModels('IDENTITY'), alternative: compareStateModels('REVERSED_LABELS') },
    camera: { planned: simulateCameraCommand(command), rejectedUnits: simulateCameraCommand({...command,unit:'cm'}) },
    optics: { photon500nm: photonEnergy(500), solarDeflection: weakDeflection(1.98847e30,6.957e8), aperture: aperture(100,1) },
    scope: 'LOCAL_DETERMINISTIC_CALCULATIONS_AND_SYNTHETIC_INPUTS'
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== 'demo') throw new Error('Use: node branches/code-observation-lab/cli.mjs demo');
  console.log(JSON.stringify(demonstration(),null,2));
}
