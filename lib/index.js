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
		cacheSize: 256,
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

	this.interval = 1000 * 60 * 5; // 10 minutes.
	this.maximumStatusLength = 137;
	this.tweetHook = tweetHook;
	
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
		console.log('check-npm heartbeat');
		_this.npmChecker.checkForUpdates(function(packages) {
			if (packages.length > 0) {
				_this.publishNewPackages(packages);
			}
		});
	}, this.interval);
};

exports.NPMTweets.prototype.publishNewPackages = function (packages) {
	var _this = this,
			totalPackages = packages.length;

	async.each(packages, function (pkg, cb) {
		var tweet = _this.createTweet(pkg);
		if (tweet) {
			console.log('publishing tweet:', tweet)
			_this.twitter.post('statuses/update', {status: tweet}, function (data) {
				puts(inspect(data));
				cb();
			});
		}
	}, function (err) {
		if (err) console.log(err);
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