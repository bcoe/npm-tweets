var http = require('http'),
	async = require('async'),
	request = require('request'),
	_ = require('underscore');

exports.CheckNPM = function(options) {
	_.extend(this, {
		cache: null,
		dateOffset: 900000, // 15 minutes.
		packagePageUrl: 'https://skimdb.npmjs.com',
		packagePagePath: '/-/all/since'
	}, options);
};

exports.CheckNPM.prototype.checkForUpdates = function(callback) {
	var _this = this,
		options = {
			url: this.packagePageUrl + this.packagePagePath + '?stale=update_after&startkey='+ ((new Date().getTime()) - this.dateOffset),
			headers: {
				'User-Agent': 'npm-tweets',
				'host': 'registry.npmjs.org'
			},
			rejectUnauthorized: false,
			json: true
		};

		request.get(options, function(err, res, obj) {
			try {
				var rawPackages = [],
					responseJSON = obj;

				Object.keys(responseJSON).forEach(function(key) {
					if (key !== '_updated') rawPackages.push(responseJSON[key]);
				});

				_this.returnNewPackages(rawPackages, callback);
			} catch (e) {
				_this.returnNewPackages([], callback)
			}
		});
};

exports.CheckNPM.prototype.returnNewPackages = function(rawPackages, callback) {
	this.getNewPackages(rawPackages, function(err, newPackages) {
		callback(err, newPackages);
	});
};

exports.CheckNPM.prototype.getNewPackages = function(rawPackages, callback) {
	var _this = this,
		newPackages = [],
		work = [];

	rawPackages.forEach(function(rawPackage) {
		work.push(function(done) {
			var mungedPackage = _this.mungePackage(rawPackage);

			// Check if this package is a major release.
			if (_this.majorRelease(mungedPackage) && _this.filterPackage(rawPackage)) {

				// Is this key already in the cache?
				_this.cache.inCache(mungedPackage, function(err, inCache) {
					if (!inCache) {

						// if not in cache, add to list of packages to publish.
						_this.cache.add(mungedPackage, function(err) {
							newPackages.unshift(mungedPackage);
							done(err);
						});
					} else {
						done(err);
					}
				});
			} else {
				done();
			}
		});
	});

	// execute work synchronously since
	// for the sake of redis driver.
	async.waterfall(work, function(err) {
		callback(err, newPackages);
	});
};

exports.CheckNPM.prototype.mungePackage = function(rawPackage) {

	var distTags = rawPackage['dist-tags'] || {},
		author = rawPackage.author || {};

	return {
		author: author.name ? author.name : '',
		version: distTags.latest || false,
		description: rawPackage.description || '',
		name: rawPackage.name,
		url: 'https://npmjs.com/package/' + escape(rawPackage.name)
	}
};

exports.CheckNPM.prototype.majorRelease = function(package) {
	var majorRegex = /([0-9]+\.[0-9]+\.0$)|(0\.0\.1$)/;
	return !!package.version.match(majorRegex);
};

exports.CheckNPM.prototype.filterPackage = function (package) {
  return this.filter ? this.filter(package) : true;
};
