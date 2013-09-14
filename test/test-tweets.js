var equal = require('assert').equal,
	puts = require('sys').puts,
	NPMTweets = require('../lib/index').NPMTweets;

NPMTweets.prototype.startTweeting = function() {};

exports.tests = {
	'should create a tweet from a package object.': function(finished) {
		var npmTweets = new NPMTweets();
		var tweet = npmTweets.createTweet({
			version: '0.0.1',
			description: 'My stupid description.',
			url: 'www.example.com',
			name: 'foolib'
		});
		equal('foolib (0.0.1): www.example.com My stupid description.', tweet);
		finished();
	},
	
	'should be able to cancel a tweet using the tweetHook': function(finished) {
		var npmTweets = new NPMTweets({}, function() {
			return false;
		});
		var tweet = npmTweets.createTweet({
			version: '0.0.1',
			description: 'My stupid description.',
			url: 'www.example.com',
			name: 'foolib'
		});
		equal(false, tweet);
		finished();
	},
	
	'should be able to replace text in a tweet using the tweetHook': function(finished) {
		var npmTweets = new NPMTweets({}, function(text) {
			return text.replace('Yes', 'Yar');
		});
		var tweet = npmTweets.createTweet({
			version: '0.0.1',
			description: 'Yes this is my stupid description.',
			url: 'www.example.com',
			name: 'foolib'
		});
		equal('foolib (0.0.1): www.example.com Yar this is my stupid description.', tweet);
		finished();
	}
}