var puts = require('sys').puts,
	inspect = require('sys').inspect,
	twitter = require('twitter'),
	CheckNPM = require('./check-npm').CheckNPM,;

exports.NPMTweets = function(params) {
	this.twitter = new twitter({
		consumer_key: params.consumer_key,
		consumer_secret: params.consumer_secret,
		access_token_key: params.access_token_key,
		access_token_secret: params.access_token_secret
	});
	this.npmChecker = new CheckNPM();
	this.interval = 30000; // 30 seconds.
	this.checkNPMHeartbeat();
	this.maximumStatusLength = 137;
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
		this.twitter.updateStatus(tweet, function(data) {
			puts(inspect(data));
		});		
	}
};

exports.NPMTweets.prototype.createTweet = function(package) {
	var tweet = package.name + ' (' + package.version + '): ' + package.url + ' ' + package.description;
	if (tweet.length > this.maximumStatusLength) {
		tweet = tweet.substr(0, this.maximumStatusLength);
		tweet += '...';
	}
	return tweet;
};