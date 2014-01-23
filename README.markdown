npm-tweets
==========

I published a library recently that didn't get nearly as many followers as expected.

A person of lesser hubris might have assumed that the library was was less useful than they initially assumed. Luckily I didn't make this false assumption...

The problem was that there aren't enough tweets when Node.js packages are published or updated

*npm-tweets* is an open-source twitter bot that tweets as packages are updated on npmjs.org:

http://twitter.com/#!/nodenpm

Usage
-----

I've open-sourced npm-tweets so that anyone can easily setup an npm Twitter Bot.

Creating the Bot:

```javascript
var NPMTweets = require('npm-tweets').NPMTweets;

npmTweets = new NPMTweets({
	consumer_key: 'CONSUMER_KEY',
	consumer_secret: 'CONSUMER_SECRET',
	access_token_key: 'TOKEN_KEY',
	access_token_secret: 'TOKEN_SECRET',
	filter: function(package){ return package.name === 'npm-tweets'; }
});
```

Copyright
---------

Copyright (c) 2011 Benjamin Coe See LICENSE.txt for
further details.