#!/usr/bin/env node

const path = require('path');
const tsNode = require('ts-node');
const tsConfigPath = path.resolve(__dirname, '..', 'tsconfig.json');

tsNode.register({
    project: tsConfigPath,
    transpileOnly: true,
    compilerOptions: {
        module: 'commonjs'
    }
});

require('../src/index.ts');