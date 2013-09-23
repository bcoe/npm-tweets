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

	this.interval = 60000; // 60 seconds.
	this.maximumStatusLength = 137;
	this.tweetHook = tweetHook;

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
		_this.tweetPackagesHeartbeat();
	});
};

exports.NPMTweets.prototype.checkNPMHeartbeat = function() {
	var _this = this;
	
	setInterval(function() {
		console.log('check-npm heartbeat');
		_this.npmChecker.checkForUpdates(function(packages) {
			_this.packagesToTweet = _this.packagesToTweet.concat(packages);
			console.log(packages.length, 'packages to tweet');
		});
	}, this.interval);
};

exports.NPMTweets.prototype.tweetPackagesHeartbeat = function() {
	var _this = this;

	setInterval(function() {
		console.log('tweet heartbeat');
		if (_this.packagesToTweet.length > 0) {
			_this.publishNewPackages(_this.packagesToTweet);
		}
	}, this.tweetInterval);
};

exports.NPMTweets.prototype.publishNewPackages = function (packages) {
	var _this = this,
			totalPackages = packages.length;

	async.each(packages, function (pkg, cb) {
		var tweet = _this.createTweet(pkg);
		if (tweet) {
			console.log('publishing tweet:', tweet)
			this.twitter.post('statuses/update', {status: tweet}, function (data) {
				puts(inspect(data));
				cb();
			});
		}
	}, function (err) {
		if (err) console.log(err);
		
		// new packages could have been added in this time, remove the
		// original count from packagesToTweet list.
		_this.packagesToTweet = _this.packagesToTweet.slice(totalPackages);
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