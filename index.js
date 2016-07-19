#!/usr/bin/env node

'use strict';

const processor = require('./processor.js');
const chalk = require('chalk');

const logResult = (err, result) => {
  if (err) {
    console.log(chalk.red('ERR! ') + err);
    return;
  }
  console.log(result);
};

if (!process.stdin.isTTY) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', () => {
    let chunk;
    while (chunk = process.stdin.read()) {
      data += chunk;
    }
  });

  process.stdin.on('end', () => {
    // There will be a trailing \n from the user hitting enter. Get rid of it.
    data = data.replace(/\n$/, '');

    // Do some processing
    processor.size(data, logResult);
    processor.extractToken(data, logResult);
    processor.downloadImages(data, 'out/', 100, null, logResult); // download from azure blob storage
  });
}
