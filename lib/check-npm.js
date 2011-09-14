var puts = require('sys').puts,
	http = require('http');

exports.CheckNPM = function() {
	this.cache = [];
	this.cacheSize = 128;
	this.packagePageUrl = 'search.npmjs.org';
	this.packagePagePath = '/_view/updated';
	this.descending = true,
	this.limit = 2;
};

exports.CheckNPM.prototype.checkForUpdates = function(callback) {
	var page = this.fetchPackagePage(callback);
};

exports.CheckNPM.prototype.fetchPackagePage = function(callback) {	
	var client = http.createClient(80, this.packagePageUrl),
		req = client.request('GET', this.packagePagePath + '?descending=' + this.descending + '&limit='+ this.limit + '&include_docs=true', {
			Host: this.packagePageUrl,
			'User-Agent': 'npm-tweets',
			'Cache-Control': 'max-age=0',
			'Accept': 'application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
			'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
			'Accept-Encoding': 'text/html',
			'Accept-Language': 'en-US,en;q=0.8'
		}),
		_this = this;
		
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
		
		var mungedPackage = {
			version: rawPackage.doc['dist-tags'].latest,
			description: rawPackage.doc.description,
			name: rawPackage.doc.name,
			url: 'http://' + this.packagePageUrl + '/#/' + escape(rawPackage.doc.name)
		}
		
		if (!this.inCache(mungedPackage)) {
			newPackages.unshift(mungedPackage);
			this.addToCache(mungedPackage);
		}
		
	}
	return newPackages;
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