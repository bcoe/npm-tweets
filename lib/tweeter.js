var inspect = require('util').inspect,
  twitter = require('twitter-api'),
  async = require('async'),
  _ = require('underscore');

function Tweeter(options) {

  _.extend(this, {
    twitter: twitter.createClient(),
    consumer_key: null,
    consumer_secret: null,
    access_token: null,
    access_token_secret: null,
    checkNPM: null,
    cache: null,
    interval: 1000 * 60 * 5, // 5 minutes.
    maximumStatusLength: 137
  }, options)

  // For testing, don't create client
  // if we don't provide a consumer key.
  if (this.consumer_key) {
    this.twitter.setAuth(
      this.consumer_key,
      this.consumer_secret,
      this.access_token,
      this.access_token_secret
    );
  }
};

Tweeter.prototype.startTweeting = function() {
  console.log('starting check NPM heartbeat')
  this.checkNPMHeartbeat();
};

Tweeter.prototype.checkNPMHeartbeat = function() {
  var _this = this;

  setInterval(function() {
    console.log('check-npm heartbeat');
    _this.checkNPM.checkForUpdates(function(err, packages) {
      if (err) console.log(err);

      if (packages.length > 0) {
        _this.publishNewPackages(packages);
      }
    });
  }, this.interval);
};

Tweeter.prototype.publishNewPackages = function (packages) {
  var _this = this,
      totalPackages = packages.length;

  async.each(packages, function (pkg, cb) {
    var tweet = _this.createTweet(pkg);
    if (tweet) {
      console.log('publishing tweet:', tweet);
      _this.twitter.post('statuses/update', {status: tweet}, function (data) {
        cb();
      });
    }
  }, function (err) {
    if (err) console.log(err);
  });
};

Tweeter.prototype.createTweet = function(package) {
  var tweet = package.name,
    description = package.description;

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

exports.Tweeter = Tweeter;
