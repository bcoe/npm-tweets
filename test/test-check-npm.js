var equal = require('assert').equal,
	puts = require('sys').puts,
	CheckNPM = require('../lib/check-npm').CheckNPM;
	
exports.tests = {
	'should page out packages when cache size is reached.': function(finished) {
		var checkNPM = new CheckNPM({cacheSize: 3});
		
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

		checkNPM.addToCache(p1);
		checkNPM.addToCache(p2);
		checkNPM.addToCache(p3);
		checkNPM.addToCache(p4);
		
		equal('p20.0.2', checkNPM.cache[0]);
		equal('p40.0.1', checkNPM.cache[2]);
		equal(3, checkNPM.cache.length);
		
		finished();
	},
	
	'should return true when in cache is called with a package in the cache': function(finished) {
		var checkNPM = new CheckNPM({cacheSize: 3});
		
		var p1 = {
			name: 'p1',
			version: '0.0.1'
		};

		var p2 = {
			name: 'p2',
			version: '0.0.2'
		};
		
		checkNPM.addToCache(p1);
		equal(true, checkNPM.inCache(p1));
		equal(false, checkNPM.inCache(p2));
		finished();
	},
	
	'should return a simplified structure with the keys required for tweeting when mungePackage called': function(finished) {
		var checkNPM = new CheckNPM({cacheSize: 3});
		
		var rawPackage = {
			doc: {
				'dist-tags': {
					'latest': '0.0.1'
				},
				name: 'foolib',
				description: 'awesome'
			}
		};
		
		var mungedPackage = checkNPM.mungePackage(rawPackage);
		equal('foolib', mungedPackage.name);
		equal('awesome', mungedPackage.description);
		equal('0.0.1', mungedPackage.version);
		equal('http://search.npmjs.org/#/foolib', mungedPackage.url);
		finished();
	},
	
	'should handle missing version and description keys when mungePackage is called': function(finished) {
		var checkNPM = new CheckNPM({cacheSize: 3});
		
		var rawPackage = {
			doc: {
				name: 'foolib'
			}
		};
		
		var mungedPackage = checkNPM.mungePackage(rawPackage);
		equal('foolib', mungedPackage.name);
		equal('', mungedPackage.description);
		equal(false, mungedPackage.version);
		equal('http://search.npmjs.org/#/foolib', mungedPackage.url);
		finished();
	}
}
