var equal = require('assert').equal,
  async = require('async'),
  CheckNPM = require('../lib/check-npm').CheckNPM,
  Cache = require('../lib/cache').Cache,
  redisUrl = require('redis-url'),
  redis = redisUrl.connect(process.env.REDIS_URL),
  twitterStream = [
    {text:"ttapi(0.4.2): http://t.co/ypC7rw9b A turntable.fm API"},
    {text:"g (1.0.0): http://t.co/hE2t2Iiu Globalizes module functions"},
    {text:"net: http://t.co/ODJ1iZ3j Globalizes the 'net' module functions"},
    {text:"net(undefined): http://t.co/ODJ1iZ3j Globalizes the 'net' module functions"},
    {text:"qbox(0.1.4): http://t.co/qLt4ujVz JQuery like queue solution for NodeJs"},
    {text:"game(1.0.0): http://t.co/vSvOFqa8 A simple adventure game"},
    {text:"justtest(0.0.2): http://t.co/CcNkg3k9 Unit tests with JSDOM wrapper."},
    {text:"chopper(1.0.0): http://t.co/9VzAc7tx Cuts a stream into discrete pieces using a delimiter"},
    {text:"swig(0.2.3): http://t.co/grENPMyF A fast django-like templating engine for node.js."},
    {text:"youtube-dl(1.2.0): http://t.co/Ycf3pQm2 youtube-dl driver for node"},
    {text:"youtube-dl(1.1.2): http://t.co/Ycf3pQm2 youtube-dl driver for node"},
    {text:"sax(0.2.4): http://t.co/osTzbLTn An evented streaming XML parser in JavaScript"},
    {text:"swig(0.2.2): http://t.co/grENPMyF A fast django-like templating engine for node.js."},
    {text:"transitive(0.0.0pre28): http://t.co/ahqcXDO8 very rough version. please ignore"},
    {text:"compress-buffer(0.3.2): http://t.co/TRwHCTVf Single-step Buffer compression library for Node.js"},
    {text:"gherkin(2.4.21): http://t.co/l8oZ1sEp A fast Gherkin lexer/parser based on the Ragel State Machine Compiler."},
    {text:"forker(1.3.1): http://t.co/JAPvp0qd A forking HTTP proxy (you heard me)"},
    {text:"srs(0.2.8): http://t.co/ZXPwhCYq Spatial reference library for node"},
    {text:"zipfile(0.2.4): http://t.co/Jt77BOqT C++ library for handling zipfiles in node"},
    {text:"postprocess(0.0.2): http://t.co/MAoLVsCy Connect middleware providing request post-proccessing."}
  ];

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
      version: '0.0.1'
    };

    var p2 = {
      name: 'p2',
      version: '0.0.2'
    };

    var p3 = {
      name: 'p3',
      version: '0.0.3'
    };

    var p4 = {
      name: 'p4',
      version: '0.0.1'
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
        version: '0.0.1'
      };

      var p2 = {
        name: 'p1.lodash',
        version: '0.0.1'
      };
      
      cache.add(p1, function() {
        cache.inCache(p2, function(err, inCache) {
          equal(true, inCache);
          done();
        });
      });
    });

    it('should return true when a package is in the cache', function(done) {
      var cache = new Cache({cacheSize: 3});
      
      var p1 = {
        name: 'p1',
        version: '0.0.1'
      };

      var p2 = {
        name: 'p2',
        version: '0.0.2'
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
        version: '0.0.1'
      };

      var p2 = {
        name: 'p2',
        version: '0.0.2'
      };
      
      cache.add(p1, function() {
        cache.inCache(p2, function(err, inCache) {
          equal(false, inCache);
          done();
        });
      });
    });
  });

  it('should seed the cache from a twitter stream passed in', function(done) {
    var cache = new Cache({cacheSize: 19});
    cache.seedCacheWithTwitterStream(twitterStream, function () {
      redis.lrange(Cache.key, 0, 999, function(err, values) {
        equal('g1.0.0', values[0]);
        equal('net', values[1]);
        equal('postprocess0.0.2', values[18]);
        done();
      });
    });
  });
});
