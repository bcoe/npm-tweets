var _ = require('underscore'),
  redisUrl = require('redis-url'),
  async = require('async');

function Cache(opts) {
  _.extend(this, {
    redis: redisUrl.connect(process.env.REDIS_URL),
    cache: [],
    cacheSize: 256
  }, opts);
}

Cache.prototype.add = function(package) {
  var _this = this,
    newKey = this.createKey(package);

  // maintain a list in redis of up to 
  // cacheSize values.
  async.waterfall([
    function(done) {
      _this.redis.lpush(Cache.key, newKey, function(err) {
        if (err) {console.log(err)};
        done(err);
      });
    },
    function(done) {
      _this.redis.llen(Cache.key, function(err, value) {
        if (err) {
          // an error occurred fetching the
          // length of the list.
          console.log(err);
          done(err);
        } else {
          if (value > _this.cacheSize) {
            // we've filled the cache!
            _this.redis.rpop(Cache.key, function() {
              if (err) console.log(err);
              done(err);
            });
          } else {
            // cache is not full no
            // need to pop.
            done();
          }
        }
      });
    }
  ]);

  this.cache.push(newKey);
  if (this.cache.length > this.cacheSize) {
    this.cache.shift();
  }
};

Cache.prototype.inCache = function(package) {
  var newKey = this.createKey(package);
  for (var i = 0, key; (key = this.cache[i]) != null; i++) {
    if (key == newKey) {
      return true;
    }
  }
  return false;
};

Cache.prototype.seedCacheWithTwitterStream = function(twitterFeed, callback) {
  var _this = this;

  async.each(twitterFeed, function (tweet, cb) {
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

    _this.add(package);

    cb();
  }, function (err) {
    callback(err);
  });
};

Cache.prototype.createKey = function(package) {
  return (package.name + package.version);
};

Cache.key = 'npm-published-packages';

exports.Cache = Cache;