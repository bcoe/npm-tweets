var equal = require('assert').equal,
	puts = require('sys').puts,
	Tweeter = require('../lib/tweeter').Tweeter;

describe('#tweeter', function() {
	describe('#createTweet', function () {
		it('should create a tweet from a package object.', function() {
			var tweeter = new Tweeter(),
				tweet = tweeter.createTweet({
					version: '0.0.1',
					description: 'My stupid description.',
					url: 'www.example.com',
					name: 'foolib'
				});
			
			equal('foolib (0.0.1): www.example.com My stupid description.', tweet);
		});
	});
});