var puts = require('util').puts,
	http = require('http'),
	_ = require('underscore');

exports.CheckNPM = function(options) {
	_.extend(this, {
		dateOffset: 900000, // 15 minutes.	
		cacheSize: 64,
		packagePageUrl: 'registry.npmjs.org',
		packagePagePath: '/-/all/since',
		cache: []
	}, options);
};

exports.CheckNPM.prototype.checkForUpdates = function(callback) {
	var page = this.fetchPackagePage(callback);
};

exports.CheckNPM.prototype.fetchPackagePage = function(callback) {	
	var client = http.createClient(80, this.packagePageUrl),
		_this = this;
	
	client.addListener('error', function(e) {
		puts(e);
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
	var newPackages = this.getNewPackages(rawPackages);
	callback(newPackages);
};

exports.CheckNPM.prototype.getNewPackages = function(rawPackages) {
	var newPackages = [];
	for (var i = 0, rawPackage; (rawPackage = rawPackages[i]) != null; i++) {
		
		var mungedPackage = this.mungePackage(rawPackage);
		
		if (!this.inCache(mungedPackage)) {
			newPackages.unshift(mungedPackage);
			this.addToCache(mungedPackage);
		}
		
	}
	return newPackages;
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

exports.CheckNPM.prototype.seedCacheWithTwitterStream = function(twitterFeed) {
	for (var i = 0; i < twitterFeed.length; i++) {
		var text = twitterFeed[i].text;
		var name = text.match('([^:( ]*)')[1];
		var version = '';
		if (text.match(/\((.*)\)/)) {
			version = text.match(/\(([^:]*)\)/)[1];
		}
		var package = {
			name: name,
			version: version
		};
		console.log(package);
		this.addToCache(package);
	};
};

exports.CheckNPM.prototype.addToCache = function(package) {
	var newKey = this.createKey(package);
	this.cache.push(newKey);
	if (this.cache.length > this.cacheSize) {
		this.cache.shift();
	}
};

exports.CheckNPM.prototype.inCache = function(package) {
	var newKey = this.createKey(package);
	for (var i = 0, key; (key = this.cache[i]) != null; i++) {
		if (key == newKey) {
			return true;
		}
	}
	return false;
}

exports.CheckNPM.prototype.createKey = function(package) {
	return (package.name + package.version);
};