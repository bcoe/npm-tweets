var equal = require('assert').equal,
	CheckNPM = require('../lib/check-npm').CheckNPM,
  Cache = require('../lib/cache').Cache,
  cache = new Cache(),
  redisUrl = require('redis-url'),
  redis = redisUrl.connect(process.env.REDIS_URL);

describe('CheckNPM', function() {

  beforeEach(function(done) {
    redis.del(Cache.key, function(err, result) {
      done();
    });
  });

	describe('#returnNewPackages', function() {
		it('adds package to newPackages if not in cache', function(done) {
			var checkNPM = new CheckNPM({cache: cache}),
				rawPackages = [{
				'dist-tags': {
					'latest': '0.0.1'
				},
				name: 'foolib',
				description: 'awesome'
			}];

			checkNPM.returnNewPackages(rawPackages, function(err, newPackages) {
				equal('foolib', newPackages[0].name);
				equal('0.0.1', newPackages[0].version);
				done();
			});
		});

		it('does not add package to newPackages if it is in cache', function(done) {
			var checkNPM = new CheckNPM({cache: cache}),
				rawPackages = [{
				'dist-tags': {
					'latest': '0.0.1'
				},
				name: 'foolib',
				description: 'awesome'
			}];

			checkNPM.returnNewPackages(rawPackages, function(err, newPackages) {
				equal('foolib', newPackages[0].name);
				equal('0.0.1', newPackages[0].version);
				equal(newPackages.length, 1);

				checkNPM.returnNewPackages(rawPackages, function(err, newPackages) {
					equal(newPackages.length, 0);
					done();
				});
			});
		});
	});

	describe('#mungePackage', function() {
		it('should return a simplified structure with the keys required for tweeting', function() {
			var checkNPM = new CheckNPM(),
				rawPackage = {
					'dist-tags': {
						'latest': '0.0.1'
					},
					name: 'foolib',
					description: 'awesome',
					author: {name: 'ben'}
				},
				mungedPackage = checkNPM.mungePackage(rawPackage);

			equal('ben', mungedPackage.author);
			equal('foolib', mungedPackage.name);
			equal('awesome', mungedPackage.description);
			equal('0.0.1', mungedPackage.version);
			equal('https://npmjs.org/package/foolib', mungedPackage.url);
		});

		it('should handle missing version and description keys', function() {
			var checkNPM = new CheckNPM(),
				rawPackage = {
					name: 'foolib'
				},
				mungedPackage = checkNPM.mungePackage(rawPackage);

			equal('foolib', mungedPackage.name);
			equal('', mungedPackage.description);
			equal(false, mungedPackage.version);
			equal('https://npmjs.org/package/foolib', mungedPackage.url);
		});

		it('should handle missing author key', function() {
			var checkNPM = new CheckNPM(),
				rawPackage = {
					name: 'foolib'
				},
				mungedPackage = checkNPM.mungePackage(rawPackage);

			equal('', mungedPackage.author);
		});

		it('should handle missing author.name', function() {
			var checkNPM = new CheckNPM(),
				rawPackage = {
					name: 'foolib',
					author: {email: 'bencoe@gmail.com'}
				},
				mungedPackage = checkNPM.mungePackage(rawPackage);

			equal('', mungedPackage.author);
		});
	});

	describe('#majorRelease', function() {
		it('should publish major releases', function() {
			var checkNPM = new CheckNPM();
			
			var rawPackage1 = {
				version: '1.0.0',
				name: 'foolib',
				description: 'awesome'
			};

			var rawPackage2 = {
				version: '0.10.0',
				name: 'foolib',
				description: 'awesome'
			};

			equal(checkNPM.majorRelease(rawPackage1), true);
			equal(checkNPM.majorRelease(rawPackage2), true);
		});

		it('should not publish minor release', function() {
			var checkNPM = new CheckNPM();
			
			var rawPackage1 = {
				version: '11.2.2',
				name: 'foolib',
				description: 'awesome'
			};

			var rawPackage2 = {
				version: '0.0.12',
				name: 'foolib',
				description: 'awesome'
			};

			var rawPackage3 = {
				version: '0.0.0-158',
				name: 'foolib',
				description: 'awesome'
			};

			equal(checkNPM.majorRelease(rawPackage1), false);
			equal(checkNPM.majorRelease(rawPackage2), false);
			equal(checkNPM.majorRelease(rawPackage3), false);
		});

		it('should publish initial releases', function() {
			var checkNPM = new CheckNPM();
			
			var rawPackage1 = {
				version: '0.0.0',
				name: 'foolib',
				description: 'awesome'
			};

			var rawPackage2 = {
				version: '0.0.1',
				name: 'foolib',
				description: 'awesome'
			};

			equal(checkNPM.majorRelease(rawPackage1), true);
			equal(checkNPM.majorRelease(rawPackage2), true);
		});
	});

  describe('#filterPackage', function() {
    var rawData = [{
      'dist-tags': {
        'latest': '0.0.1'
      },
      versions:{
        '0.0.1':{
          keywords:['A','B','C']
        }
      },
      name: 'foolib1',
      description: 'awesome'
    },
      {
        'dist-tags': {
          'latest': '0.0.1'
        },
        versions:{
          '0.0.1':{
            keywords:['C']
          }
        },
        name: 'foolib2',
        description: 'awesome'
      },
      {
        'dist-tags': {
          'latest': '0.0.1'
        },
        versions:{
          '0.0.1':{
            keywords:['B']
          }
        },
        name: 'foolib3',
        description: 'awesome'
      }];

    it('should do nothing if no filter defined', function(done) {
      var checkNPM = new CheckNPM({cache: cache}),
          rawPackages = rawData;

      checkNPM.returnNewPackages(rawPackages, function(err, newPackages) {
        equal(newPackages.length, 3);
        done();
      });
    });

    it('should filter all if filter returns always false', function(done) {
      var checkNPM = new CheckNPM({cache: cache, filter: function(){
            return false;
          }}),
          rawPackages =rawData;

      checkNPM.returnNewPackages(rawPackages, function(err, newPackages) {
        equal(newPackages.length, 0);
        done();
      });
    });

    it('should filter none if filter returns always true', function(done) {
      var checkNPM = new CheckNPM({cache: cache, filter: function(){
            return true;
          }}),
          rawPackages =rawData;

      checkNPM.returnNewPackages(rawPackages, function(err, newPackages) {
        equal(newPackages.length, 3);
        done();
      });
    });

    it('should use filter-function to filter the rawdata', function(done) {
      var checkNPM = new CheckNPM({cache: cache, filter: function(package){
            var latestVersion = package['dist-tags'].latest;
            return package.versions[latestVersion].keywords.length > 2;
          }}),
          rawPackages =rawData;

      checkNPM.returnNewPackages(rawPackages, function(err, newPackages) {
        equal(newPackages.length, 1);
        done();
      });
    });
  });

});
