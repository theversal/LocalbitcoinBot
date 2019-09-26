var login = require('./login').login

var LBCClient = require('../localbitcoins-api');

var lbc = new LBCClient(login.localFirst.apiKey, login.localFirst.apiSecret, login.proxy);

//second local account
let local_two = new LBCClient(login.localSecond.apiKey, login.localSecond.apiSecret, login.proxy);

var other = require('./other')

var msg = other.messages();

exports.edit = function edit(to){ // edit my ad 

	let dataSellOptions = login.account.sellOrderOptions,
		dataBuyOptions = login.account.buyOrderOptions;

	if(to.type === 'ONLINE_BUY' && to.amount < Number(dataBuyOptions.minOpenOrderAmount)) {

		to.amount = Number(dataBuyOptions.minOpenOrderAmount) + 1;
		to.visible = false;
		
	}

	if(to.amount > Number(dataSellOptions.maxOpenOrderAmount)) to.amount = Number(dataSellOptions.maxOpenOrderAmount);

	let check = {
		trade_type: to.type,
		bank_name: '',
		countrycode: 'RU',
		lon: 0,
		lat: 0,
		min_amount: to.min,
		max_amount: to.amount,
		msg: msg[to.system][to.type],
		currency: 'RUB',
		online_provider: to.system,
		price_equation: to.price,
		visible: to.visible
	};

	if(to.type === 'ONLINE_SELL'){

		check['details-phone_number'] = '000000000';
		check['sms_verification_required'] = dataSellOptions.sms_verification_required;
		//check['require_identification'] = true;
	}
	if(to.type === 'ONLINE_BUY') check['track_max_amount'] = true;

	return new Promise((resolve, reject) => {

		local_two.api('ad', to.id, check, function(error, data) {
			if(error || !data.data){
			 	other.error({'edit ads': error, data, check})
			 	console.log('error edit ads')
			 	resolve(false)

			} else {

			let mess = data.data.message;
			//console.log(mess)
				if(mess.indexOf('changed successfully') > 1){
					other.success({'edit ads': [error, data, to]})
					resolve(true)

				} else {
					console.log(error)
					console.log(data);
					other.error({'else edit ads': error, data})
					resolve(false)
				}
		   }
		})
	})
}

exports.ad_equation = function ad_equation(to){

	let option = {
		price_equation: to.price
	}

	return new Promise((resolve, reject) => {
		local_two.api('ad-equation', to.id, option, function(error, data) {
			if(error || !data){
				console.log(data)
				other.error({'ad_equation': error, data})
				resolve(false)
			} else {
				//console.log(data)
				resolve(true)
			}
		})
	})
}
exports.dashboard = function dashboard(line, provider){


   var account = local_two,
   	      list = [];

	if(line) account = lbc;

   return new Promise((resolve, reject) => {

	account.api('dashboard', false, {}, function(error, data) {

		if(!error && data && data.data && data.data.contact_list){

		    data = data.data.contact_list;
		    let k = 0;
		    for(let i = 0; i < data.length; i++){
		    	let system = data[i].data.advertisement.payment_method;
		    	if(system === provider){
		    		list[k] = data[i];
		    		k = k + 1;
		    	}
		    }

		    resolve(list);
		} else {
			other.error({'dashboard': error, data})
			resolve(false)
		}
	});
})
}
///api/dashboard/closed/
exports.dashboardClose = function dashboardClose(){
   var account = local_two,
   	   list = {};

	console.log('dash close')
   return new Promise((resolve, reject) => {

	account.api('dashboard/closed', false, {}, function(error, data) {

		if(!error && data && data.data && data.data.contact_list){

		    list = data.data.contact_list;
		    resolve(list);
		} else {
			console.log(data)
			resolve(false)
		}	
	});
})
}


exports.message = function message(text, id, callback){
	

var params = {
	msg: text
}

		lbc.api('contact_message_post', id, params, callback);
	
}

exports.sendImage = function sendImage(doc, id){
	

var params = {
	document: doc
}


return new Promise((resolve, reject) => {
		lbc.api('contact_message_post', id, params, function(error, data){
			console.log(error)
			console.log(data)
		});
	})
}


exports.markpaid = function markpaid(id){
var params = {
	
}
return new Promise((resolve, reject) => {
		lbc.api('contact_mark_as_paid', id, params, function(error, data) {
			if(!error){
			console.log(id + ' - marked as paid')
			resolve(true)
		} else { 
			resolve(false)
		}
           });
		})
}

exports.cancelOrder = function cancelOrder(id){
var params = {
	
}
return new Promise((resolve, reject) => {
		lbc.api('contact_cancel', id, params, function(error, data) {
			if(!error){
			console.log(id + ' - order was canceled')
			resolve(true)
		} else { 
			resolve(false)
		}
           });
		})
}

exports.markreleased = function markleased(id){
var params = {
	
}
return new Promise((resolve, reject) => {


		lbc.api('contact_release', id, params, function(error, data) {
			//console.log(data)
			if(!error){
				console.log(id + ' - marked as released')
				resolve(true)
			} else {
				console.log(error)
				resolve(false)
			}
			
           });
	})
}

exports.adgets = function adgets(system){

	var ads = {};
	return new Promise((resolve, reject) => {

		local_two.api('ads', '', {}, function(error, data) {

			if(!error && data && data.data && !!data.data.ad_list){
				data = data.data.ad_list;
				
				for(let i = 0; i < data.length; i ++){
					let provider = data[i].data.online_provider;
					if(!ads[provider]) ads[provider] = {};

					if(data[i].data.trade_type === 'ONLINE_BUY'){
						ads[provider]['buyOrder'] = data[i].data;
					} else { 
						ads[provider]['sellOrder'] = data[i].data;
					}
				}

				resolve(ads[system])

			} else {
				other.error({'adgets': error})
				console.log('does not get ads')
				resolve(false) 
			}
           });
	})
}


exports.openDispute = function openDispute(id){
	return new Promise((resolve, reject) => {
		lbc.api('contact_dispute', id, {}, function(error, data) {
 			resolve('Successfully was opened Disput')
		})
	})
}


exports.getMessages = function getMessages(id){
	return new Promise((resolve, reject) => {
		lbc.api('contact_messages', id, {}, function(error, data) {
			if(data && !error){
				resolve(data)
			} else { 
				reject(data)
			}
			
		})
	})
}


exports.userInfo = function userInfo(name){
	return new Promise((resolve, reject) => {
		lbc.api('account_info', name, {}, function(error, data) {
			if(data && !error && data.data){

				resolve(data.data)
			} else { 
				resolve(data)
			}
			
		})
	})
}



