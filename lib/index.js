var puts = require('sys').puts,
	inspect = require('sys').inspect,
	twitter = require('twitter'),
	CheckNPM = require('./check-npm').CheckNPM,
	sexy = require('sexy-args');

exports.NPMTweets = function(params, tweetHook) {
	sexy.args([this, ['object1', 'function1'], 'function1'], {
		'object1': {
			cacheSize: 64,
			packagePageUrl: 'search.npmjs.org',
			packagePagePath: '/_view/updated',
			limit: 5
		},
		'function1': function(text) {
			return text;
		}
	},
	function() {

		var _this = this;

		this.twitter = new twitter({
			consumer_key: params.consumer_key,
			consumer_secret: params.consumer_secret,
			access_token_key: params.access_token_key,
			access_token_secret: params.access_token_secret
		});

		this.interval = 30000; // 30 seconds.
		this.maximumStatusLength = 137;
		this.tweetHook = tweetHook;
		this.startTweeting();
	});
};

exports.NPMTweets.prototype.startTweeting = function() {
	this.twitter.getUserTimeline(function(data) {
		_this.npmChecker = new CheckNPM(params);
		_this.npmChecker.seedCacheWithTwitterStream(data);
		_this.checkNPMHeartbeat();
	});	
};

exports.NPMTweets.prototype.checkNPMHeartbeat = function() {
	var _this = this;
	setInterval(function() {
		_this.npmChecker.checkForUpdates(function(packages) {
			if (packages.length > 0) {
				_this.publishNewPackages(packages);
			}
		});
	}, this.interval);
};

exports.NPMTweets.prototype.publishNewPackages = function(packages) {
	for (var i = 0, package; (package = packages[i]) != null; i++) {
		var tweet = this.createTweet(package);
		if (tweet) {
			this.twitter.updateStatus(tweet, function(data) {
				puts(inspect(data));
			});
		}
	}
};

exports.NPMTweets.prototype.createTweet = function(package) {
	var tweet = package.name,
		description = this.tweetHook(package.description);
	
	if (!description) {
		return description;
	}
	
	if (package.version) {
		tweet += ' (' + package.version + ')';
	}
	tweet += ': ' + package.url + ' ' + description;
	
	if (tweet.length > this.maximumStatusLength) {
		tweet = tweet.substr(0, this.maximumStatusLength);
		tweet += '...';
	}
	return tweet;
};