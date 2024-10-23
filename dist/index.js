"use strict";
const VirtualTestNet = require('./scripts/virtual-test-net').default;
// import { start as wizardStart } from './wizard';
const wizardStart = require('./wizard').start;
// export {
//     VirtualTestNet,
//     wizardStart
// };
// If this file is run directly (e.g., with ts-node), start the wizard
// if (require.main === module) {
//     wizardStart().catch(error => {
//         console.error('An error occurred:', error);
//         process.exit(1);
//     });
// }
wizardStart();
