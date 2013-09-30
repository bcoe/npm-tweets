var CheckNPM = require('./check-npm').CheckNPM,
	Tweeter = require('./tweeter').Tweeter;

exports.NPMTweets = function(options) {
	var checkNPM = new CheckNPM,
		tweeter = new Tweeter({
	    consumer_key: options.consumer_key,
	    consumer_secret: options.consumer_secret,
	    access_token: options.access_token,
	    access_token_secret: options.access_token_secret,
	    npmChecker: checkNPM
		});

	tweeter.startTweeting();
};