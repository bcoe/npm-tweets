var equal = require('assert').equal,
  async = require('async'),
  CheckNPM = require('../lib/check-npm').CheckNPM,
  Cache = require('../lib/cache').Cache,
  redisUrl = require('redis-url'),
  redis = redisUrl.connect(process.env.REDIS_URL);

describe('Cache', function () {

  beforeEach(function(done) {
    redis.del(Cache.key, function(err, result) {
      done();
    });
  });

  it('should page out packages when cache size is reached', function(done) {
    var cache = new Cache({cacheSize: 3});
    
    var p1 = {
      name: 'p1',
      version: '0.0.1',
      author: ''
    };

    var p2 = {
      name: 'p2',
      version: '0.0.2',
      author: ''
    };

    var p3 = {
      name: 'p3',
      version: '0.0.3',
      author: ''
    };

    var p4 = {
      name: 'p4',
      version: '0.0.1',
      author: ''
    };

    async.waterfall([
      function(done) {
        cache.add(p1, done);
      },
      function(done) {
        cache.add(p2, done);
      },
      function(done) {
        cache.add(p3, done);
      },
      function(done) {
        cache.add(p4, done);
      }
    ], function() {
      redis.lrange(Cache.key, 0, 999, function(err, values) {
        equal('p20.0.2', values[0]);
        equal('p40.0.1', values[2]);
        equal(3, values.length);
        done();
      });
    });

  });

  describe('#inCache', function() {

    it('should return true if a similar package is in the cache', function(done) {
      var cache = new Cache({cacheSize: 3});
      
      var p1 = {
        name: 'p1',
        version: '0.0.1',
        author: ''
      };

      var p2 = {
        name: 'p1.lodash',
        version: '0.0.1',
        author: ''
      };
      
      cache.add(p1, function() {
        cache.inCache(p2, function(err, inCache) {
          equal(true, inCache);
          done();
        });
      });
    });

    it('packages should only be flagged as similar if the author is the same', function(done) {
      var cache = new Cache({cacheSize: 3});
      
      var p1 = {
        name: 'p1',
        version: '0.0.1',
        author: 'benjamin'
      };

      var p2 = {
        name: 'p1.lodash',
        version: '0.0.1',
        author: ''
      };

      cache.add(p1, function() {
        cache.inCache(p2, function(err, inCache) {
          equal(false, inCache);
          done();
        });
      });
    });

    it('should return true when a package is in the cache', function(done) {
      var cache = new Cache({cacheSize: 3});
      
      var p1 = {
        name: 'p1',
        version: '0.0.1',
        author: ''
      };

      var p2 = {
        name: 'p2',
        version: '0.0.2',
        author: ''
      };
      
      cache.add(p1, function() {
        cache.inCache(p1, function(err, inCache) {
          equal(true, inCache);
          done();
        });
      });
    });

    it('should return false when a package is not in the cache', function(done) {
      var cache = new Cache({cacheSize: 3});
      
      var p1 = {
        name: 'p1',
        version: '0.0.1',
        author: ''
      };

      var p2 = {
        name: 'p2',
        version: '0.0.2',
        author: ''
      };
      
      cache.add(p1, function() {
        cache.inCache(p2, function(err, inCache) {
          equal(false, inCache);
          done();
        });
      });
    });
  });
});
