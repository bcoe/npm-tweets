var _ = require('underscore'),
  redisUrl = require('redis-url');

function Cache(opts) {
  _.extend(this, {
    redis: redisUrl.connect(process.env.REDIS_URL),
    cache: [],
    cacheSize: 256
  }, opts);
}

Cache.prototype.add = function(package) {
  var newKey = this.createKey(package);
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

Cache.prototype.createKey = function(package) {
  return (package.name + package.version);
};

Cache.key = 'npm-published-packages';

exports.Cache = Cache;