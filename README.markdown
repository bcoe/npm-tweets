NPM-Tweets
==========

I published a library recently that didn't get nearly as many followers as expected.

A person of lesser hubris might have assumed that the library was was less useful than they initially assumed. Luckily I didn't make this false assumption...

The problem was that there aren't enough tweets when Node.js packages are published or updated.

*NPM-Tweets* is an open-source twitter bot that tweets as packages are updated on npmjs.org.

Usage
-----

I've open-sourced NPM-Tweets so that anyone can easily setup a Node.js Twitter Bot.

Creating the Bot:

```javascript
var NPMTweets = require('npm-tweets').NPMTweets;

npmTweets = new NPMTweets({
	consumer_key: 'CONSUMER_KEY',
	consumer_secret: 'CONSUMER_SECRET',
	access_token_key: 'TOKEN_KEY',
	access_token_secret: 'TOKEN_SECRET'
});
```

Hooks
-----

Want to only tweet web-scale packages that are published?

```javascript
var NPMTweets = require('npm-tweets').NPMTweets;

npmTweets = new NPMTweets({
	consumer_key: 'CONSUMER_KEY',
	consumer_secret: 'CONSUMER_SECRET',
	access_token_key: 'TOKEN_KEY',
	access_token_secret: 'TOKEN_SECRET',
	tweetHook: function(text) {
		if (text.indexOf('mongo') > -1) {
			return text;
		}
		return false;
	}
});
```

Want to only tweet pirate packages?

```javascript
var NPMTweets = require('npm-tweets').NPMTweets;

npmTweets = new NPMTweets({
	consumer_key: 'CONSUMER_KEY',
	consumer_secret: 'CONSUMER_SECRET',
	access_token_key: 'TOKEN_KEY',
	access_token_secret: 'TOKEN_SECRET',
	tweetHook: function(text) {
		return text.replace('yes', 'yar');
	}
});
```

Copyright
---------

Copyright (c) 2011 Benjamin Coe See LICENSE.txt for
further details.