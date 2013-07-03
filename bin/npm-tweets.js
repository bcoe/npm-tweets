#!/usr/bin/env node

var NPMTweets = require('../lib').NPMTweets,
  optimist = require('optimist');

var argv = optimist
  .options('c', {
    alias: 'consumer_key',
    describe: 'twitter consumer token.'
  })
  .options('s', {
    alias: 'consumer_secret',
    describe: 'twitter consumer secret.'
  })
  .options('a', {
    alias: 'access_token',
    describe: 'twitter access token.'
  })
  .options('z', {
    alias: 'access_token_secret',
    describe: 'twitter access token secret.'
  })
  .options('g', {
    alias: 'start',
    describe: 'start the tweeter.'
  })
  .options('h', {
    alias: 'help',
    describe: 'show usage.'
  })
  .usage("npm-tweets --start")
  .argv;

if (argv.help) {
  console.log(optimist.help());
} else {
  new NPMTweets({
    consumer_key: argv.consumer_key || process.env.CONSUMER_KEY,
    consumer_secret: argv.consumer_secret || process.env.CONSUMER_SECRET,
    access_token: argv.access_token || process.env.ACCESS_TOKEN,
    access_token_secret: argv.access_token_secret || process.env.ACCESS_TOKEN_SECRET
  });
}
