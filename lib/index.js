var CheckNPM = require('./check-npm').CheckNPM,
	Tweeter = require('./tweeter').Tweeter,
	Cache = require('./cache').Cache;

exports.NPMTweets = function(options) {
	var cache = new Cache(),
		checkNPM = new CheckNPM({
			cache: cache
		}),
		tweeter = new Tweeter({
	    consumer_key: options.consumer_key,
	    consumer_secret: options.consumer_secret,
	    access_token: options.access_token,
	    access_token_secret: options.access_token_secret,
	    checkNPM: checkNPM,
	    cache: cache
		});

	tweeter.startTweeting();
};