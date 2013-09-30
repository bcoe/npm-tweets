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
					description: 'awesome'
				},
				mungedPackage = checkNPM.mungePackage(rawPackage);

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
});