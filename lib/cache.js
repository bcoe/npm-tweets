var _ = require('underscore'),
  redisUrl = require('redis-url'),
  async = require('async');

function Cache(opts) {
  _.extend(this, {
    redis: redisUrl.connect(process.env.REDIS_URL),
    cacheSize: 1024
  }, opts);
}

Cache.prototype.add = function(package, callback) {
  var _this = this,
    newKey = this.createKey(package);

  // maintain a list in redis of up to 
  // cacheSize npm packages.
  async.waterfall([
    function(done) {
      _this.redis.rpush(Cache.key, newKey, function(err) {
        done(err);
      });
    },
    function(done, err, foo) {
      _this.redis.llen(Cache.key, function(err, value) {
        done(err, parseInt(value));
      });
    },
    function(value, done) {
      if (value > _this.cacheSize) {
        _this.redis.lpop(Cache.key, function(err) {
          done(err);
        });        
      } else {
        done();
      }
    }
  ], function(err) {
    callback(err);
  });
};

Cache.prototype.inCache = function(package, callback) {
  var newKey = this.createKey(package);

  this.redis.lrange(Cache.key, 0, this.cacheSize, function(err, values) {
    values = values || [];

    if (values.indexOf(newKey) !== -1) {
      callback(err, true);
    } else {
      callback(err, false);
    }
  });
};

Cache.prototype.seedCacheWithTwitterStream = function(twitterFeed, callback) {
  var _this = this,
    work = [];

  twitterFeed.forEach(function(tweet) {
    work.push(function(done) {
      var text = tweet.text,
        name = text.match('([^:( ]*)')[1],
        version = '';

      if (text.match(/\((.*)\)/)) {
        version = text.match(/\(([^:]*)\)/)[1];
      }

      var package = {
        name: name,
        version: version
      };

      _this.add(package, function(err) {
        done(err);
      });
    });
  });

  async.waterfall(work, function(err) {
    callback(err);
  });
};

Cache.prototype.createKey = function(package) {
  return (package.name + package.version);
};

Cache.key = 'npm-published-packages';

exports.Cache = Cache;