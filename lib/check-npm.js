var puts = require('util').puts,
	http = require('http'),
	sexy = require('sexy-args');

exports.CheckNPM = function(options) {
	sexy.args([this, 'object1'], {
		'object1': {
			cacheSize: 64,
			packagePageUrl: 'search.npmjs.org',
			packagePagePath: '/_view/updated',
			limit: 5
		}
	}, function() {
		this.cache = [];
		this.options = options;
	});
};

exports.CheckNPM.prototype.checkForUpdates = function(callback) {
	var page = this.fetchPackagePage(callback);
};

exports.CheckNPM.prototype.fetchPackagePage = function(callback) {	
	var client = http.createClient(80, this.options.packagePageUrl),
		_this = this;
	
	client.addListener('error', function(e) {
		puts(e);
	});
	
	var req = client.request('GET', this.options.packagePagePath + '?descending=true&limit='+ this.options.limit + '&include_docs=true', {
		Host: this.options.packagePageUrl,
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
				_this.returnNewPackages( (JSON.parse(res.body)).rows , callback);
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
	
	var distTags = rawPackage.doc['dist-tags'] || {};
	
	return {
		version: distTags.latest || false,
		description: rawPackage.doc.description || '',
		name: rawPackage.doc.name,
		url: 'http://' + this.options.packagePageUrl + '/#/' + escape(rawPackage.doc.name)
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
		this.addToCache(package);
	};
};

exports.CheckNPM.prototype.addToCache = function(package) {
	var newKey = this.createKey(package);
	this.cache.push(newKey);
	if (this.cache.length > this.options.cacheSize) {
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