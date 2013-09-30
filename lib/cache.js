var _ = require('underscore'),
  redisUrl: require('redis-url');

function Cache(opts) {
  _.extend(this, {
    redis: redisUrl.connect(process.env.REDIS_URL),
    cacheKey: 'npm-published-packages'
  }, opts);
}

exports.Cache = Cache;