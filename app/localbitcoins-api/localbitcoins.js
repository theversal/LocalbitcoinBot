var request = require('request');
var crypto		= require('crypto');
var querystring	= require('querystring');
var fs = require('fs')
var formData = require('form-data');


	request = request.defaults({
		pool: {maxSockets: Infinity},
		agent: false
	});

function LBCClient(key, secret, proxy, otp) {
	var nonce = new Date() * 1000;

	if(proxy) request = request.defaults({'proxy': proxy});

	var self = this;

	var config = {
		url: 'https://localbitcoins.net/api',
		key: key,
		secret: secret,
		otp: otp,
		timeoutMS: 5000
	};

	/**
	 * This method makes a public or private API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	function api(method, ad_id, params, callback) {
		var methods = {
			onlineAds: ['buy-bitcoins-online'],
			public: ['countrycodes'],
			private: ['ad-get', 'ad-get/ad_id', 'myself', 'ads', 
			'dashboard', 'dashboard/released', 'dashboard/canceled', 'dashboard/closed', 'contact_messages', 'account_info', 
			'dashboard/released/buyer', 'dashboard/canceled/buyer', 'dashboard/closed/buyer', 'ad-equation',
			'dashboard/released/seller', 'dashboard/canceled/seller', 'dashboard/closed/seller', 'contact_dispute', 'contact_cancel',
			'wallet-send', 'wallet', 'contact_info', 'ad-create', 'contact_message_post', 'contact_mark_as_paid', 'ad', 'contact_release'
			]
		};
		if(methods.public.indexOf(method) !== -1) {
			return publicMethod(method, params, ad_id, callback);
		}
		else if(methods.private.indexOf(method) !== -1) {
			return privateMethod(method, params, ad_id, callback);
		}
		else {
			throw new Error(method + ' is not a valid API method.');
		}
	}

	/**
	 * This method makes a public API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	 ///account_info/{username}/
	function publicMethod(method, params, ad_id, callback) {
		nonce = new Date() * 1000;
		params = params || {};

		var path;
		if (ad_id) {
			path	= '/' + method + '/' + ad_id;
		} else {
			path	= '/' + method;
		}

		var url		= config.url + path;

		return rawRequest(url, {}, params, callback);
	}

	/**
	 * This method makes a private API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	function privateMethod(method, params, ad_id, callback) {
		params = params || {};
		nonce = new Date() * 1000;
//console.log(params)
//console.log(method)
		var path;

		if (ad_id) {
			path	= '/' + method + '/' + ad_id;
		} else {
			path	= '/' + method;
		}

		let rUrl = 'https://localbitcoins.net/api' + path;
		var url		= config.url + path;

		var signature = getMessageSignature(path, params, nonce);

		var headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Apiauth-Key': config.key,
			'Apiauth-Nonce': nonce,
			'Apiauth-Signature': signature
		};

		if(params.document){
			var form = new formData();
                form.append('document', fs.createReadStream('/app/json/image.png'));

              //var form = {}
           signature = getMessageSignature(path, params, nonce, form);
			return formRequest(rUrl, config.key, nonce, signature, params, form, callback)
		} else{
			return rawRequest(rUrl, headers, params, method, callback);
		}

		
	}

	/**
	 * This method returns a signature for a request as a Base64-encoded string
	 * @param  {String}  path    The relative URL path for the request
	 * @param  {Object}  request The POST body
	 * @param  {Integer} nonce   A unique, incrementing integer
	 * @return {String}          The request signature
	 */
	function getMessageSignature(path, params, nonce, form) {
		var data_params = params;


		var postParameters	= querystring.stringify(data_params);

		var path = '/api' + path + '/';

		let msg = nonce + config.key + path + 'image.jpg';

		var message = nonce + config.key + path + postParameters;

	    if(params.document) message = msg;

		var auth_hash = crypto.createHmac("sha256", config.secret).update(message).digest('hex').toUpperCase();
		return auth_hash;
	}

	/**
	 * This method sends the actual HTTP request
	 * @param  {String}   url      The URL to make the request
	 * @param  {Object}   headers  Request headers
	 * @param  {Object}   params   POST body
	 * @param  {Function} callback A callback function to call when the request is complete
	 * @return {Object}            The request object
	 */
	 function formRequest(rUrl, key, nonce, signature, params, form, callback){
	 	var options = multipartFormData(params, rUrl, key, nonce, signature, form);
		console.log(options)

	 			var req = request.post(options, function(error, response, body) {
			console.log(response)
		
			if(typeof callback === 'function') {
				var data;

				if(error) {
					callback.call(self, new Error('Error in server response: ' + JSON.stringify(error)), null);
					return;
				}

				try {
					data = JSON.parse(body);
				}
				catch(e) {
					callback.call(self, new Error('Could not understand response from server: ' + body), null);
					return;
				}

				if(data.error && data.error.length) {
					callback.call(self, data.error, null);
				}
				else {
					callback.call(self, null, data);
				}
			}
		});

		return req;
	 }

	function multipartFormData(params, url, key, nonce, signature, form) {
		var boundary = '----WebKitFormBoundary' + nonce;
		var bodyString = [];

		bodyString.push(
			'--' + boundary,
			'Content-Disposition: form-data; name="document"; filename="image.jpg"',
			'Content-Type: image/jpg',
			'',
			fs.createReadStream(__dirname + '/image.jpg')
		 );

		bodyString.push('--' + boundary + '--','');

		var content = bodyString.join('\r\n');

		var formData = {
			custom_file: {
			    value:  fs.createReadStream(__dirname + '/image.jpg'),
			    options: {
			      filename: 'image.jpg',
			      contentType: 'image/jpeg'
			    }
			}
		};
	    return {
		    formData: formData,
		    url: url + '/',
		    headers: {
			    //'Content-Type': 'multipart/form-data; boundary=' + boundary,
			    'Apiauth-Key': key,
				'Apiauth-Nonce': nonce,
				'Apiauth-Signature': signature
			    //'Content-Length': content.length
		    }
	    }
	}

	function rawRequest(url, headers, params, method, callback) {

    var gets = ['ad-get', 'dashboard', 'dashboard/released', 'dashboard/canceled',
    'dashboard/closed', 'dashboard/released/buyer', 'dashboard/canceled/buyer', 'contact_messages',
    'dashboard/closed/buyer', 'dashboard/released/seller', 'dashboard/canceled/seller',
    'dashboard/closed/seller', 'wallet', 'contact_info', 'ads', 'account_info'];
    var posts = [ 'ad-get/ad_id', 'myself', 'contact_dispute', 'ad-equation', 'contact_cancel',
    'wallet-send', 'wallet-balance', 'wallet-addr', 'ad-create', 'contact_message_post', 'contact_mark_as_paid', 'ad', 'contact_release'];

    var timeOutRequest = 60000;
    //if(method === 'dashboard') timeOutRequest = 30000;

    if (posts.indexOf(method) !== -1) {
		
			var options = {
				url: url + '/',
				headers: headers,
				timeout: timeOutRequest,
				form: params
			};


		var req = request.post(options, function(error, response, body) {
			//console.log(response)
		
			if(typeof callback === 'function') {
				var data;

				if(error) {
					callback.call(self, new Error('Error in server response: ' + JSON.stringify(error)), null);
					return;
				}

				try {
					data = JSON.parse(body);
				}
				catch(e) {
					callback.call(self, new Error('Could not understand response from server: ' + body), null);
					return;
				}

				if(data.error && data.error.length) {
					callback.call(self, data.error, null);
				}
				else {
					callback.call(self, null, data);
				}
			}
		});

		return req;

	 } else {

		var options = {
			url: url + '/',
			timeout: timeOutRequest,
			headers: headers
		};

		var req = request.get(options, function(error, response, body) {
			if(typeof callback === 'function') {
				var data;
				if(error) {
					callback.call(self, new Error('Error in server response: ' + JSON.stringify(error)), null);
					return;
				}

				try {
					data = JSON.parse(body);
				}
				catch(e) {
					callback.call(self, new Error('Could not understand response from server: ' + body), null);
					return;
				}

				if(data.error && data.error.length) {
					callback.call(self, data.error, null);
				}
				else {
					callback.call(self, null, data);
				}
			}
		});

		return req;
	}
	}

	self.api			= api;
	self.publicMethod	= publicMethod;
	self.privateMethod	= privateMethod;
}

module.exports = LBCClient;
