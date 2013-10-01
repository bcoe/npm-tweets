var http = require('http'),
	async = require('async'),
	_ = require('underscore');

exports.CheckNPM = function(options) {
	_.extend(this, {
		cache: null,
		dateOffset: 900000, // 15 minutes.	
		packagePageUrl: 'registry.npmjs.org',
		packagePagePath: '/-/all/since'
	}, options);
};

exports.CheckNPM.prototype.checkForUpdates = function(callback) {	
	var client = http.createClient(80, this.packagePageUrl),
		_this = this;
	
	client.addListener('error', function(e) {
		console.log(e)
	});

	var req = client.request('GET', this.packagePagePath + '?stale=update_after&startkey='+ ((new Date().getTime()) - this.dateOffset), {
		Host: this.packagePageUrl,
		'User-Agent': 'npm-tweets',
		'Cache-Control': 'max-age=0',
		'Accept': 'application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
		'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
		'Accept-Encoding': 'text/html',
		'Accept-Language': 'en-US,en;q=0.8'
	});
	
	req.end();

	req.addListener('response', function(res){
		res.body = '';
		res.addListener('data', function(chunk){ res.body += chunk; });
		res.addListener('end', function(){
			try {
				var rawPackages = [],
					responseJSON = JSON.parse(res.body);

				Object.keys(responseJSON).forEach(function(key) {
					if (key !== '_updated') rawPackages.push(responseJSON[key]);
				});

				_this.returnNewPackages( rawPackages, callback);
			} catch (e) {
				_this.returnNewPackages([], callback)
			}
		});
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
			if (_this.majorRelease(mungedPackage)) {

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
	
	var distTags = rawPackage['dist-tags'] || {};
	
	return {
		version: distTags.latest || false,
		description: rawPackage.description || '',
		name: rawPackage.name,
		url: 'https://npmjs.org/package/' + escape(rawPackage.name)
	}
};

exports.CheckNPM.prototype.majorRelease = function(package) {
	var majorRegex = /([0-9]+\.[0-9]+\.0$)|(0\.0\.1$)/;
	return !!package.version.match(majorRegex);
};