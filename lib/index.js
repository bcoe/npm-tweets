var puts = require('util').puts,
	inspect = require('util').inspect,
	twitter = require('twitter-api'),
  async = require('async'),
	CheckNPM = require('./check-npm').CheckNPM,
	_ = require('underscore');

exports.NPMTweets = function(options, tweetHook) {
	options = options || {};
	tweetHook = tweetHook || function(text) {return text};

	_.extend(options, {
		cacheSize: 64,
		packagePageUrl: 'registry.npmjs.org',
		packagePagePath: '/-/all/since',
		limit: 5
	}, options);

	this.twitter = twitter.createClient();

	// For testing, don't create client
	// if we don't provide a consumer key.
	if (options.consumer_key) {
		this.twitter.setAuth(
		  options.consumer_key,
		  options.consumer_secret, 
		  options.access_token,
		  options.access_token_secret
		);
	}

	this.interval = 30000; // 30 seconds.
	this.maximumStatusLength = 137;
	this.tweetHook = tweetHook;

	this.lastTweeted = null;
	this.tweetInterval = 1000 * 60 * 15; // 15 minutes
	this.packagesToTweet = [];
	
	this.startTweeting(options);
};

exports.NPMTweets.prototype.startTweeting = function(options) {
	var _this = this;

	this.twitter.get('statuses/user_timeline', {}, function(data) {
		_this.npmChecker = new CheckNPM(options);
		_this.npmChecker.seedCacheWithTwitterStream(data);
		_this.checkNPMHeartbeat();
	});
};

exports.NPMTweets.prototype.checkNPMHeartbeat = function() {
	var _this = this;
	
	setInterval(function() {
		_this.npmChecker.checkForUpdates(function(packages) {
			_this.packagesToTweet = _this.packagesToTweet.concat(packages);
			
			if (_this.packagesToTweet.length > 0 && _this.canTweet()) {
				_this.publishNewPackages(_this.packagesToTweet);
			}
		});
	}, this.interval);
};

exports.NPMTweets.prototype.publishNewPackages = function (packages) {
	var _this = this;

	async.each(packages, function (pkg, cb) {
		var tweet = _this.createTweet(pkg);
		if (tweet) {
			this.twitter.post('statuses/update', {status: tweet}, function (data) {
				puts(inspect(data));
				cb();
			});
		}
	}, function () {
		_this.packagesToTweet = [];
		_this.lastTweeted = Date.now();
	});
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


exports.NPMTweets.prototype.canTweet = function () {
	return Date.now() >= (this.lastTweeted + this.tweetInterval);
};