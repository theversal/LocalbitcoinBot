
exports.Time = function Time(date){
	var date = new Date();
	var hour = date.getHours();
	hour = (hour < 10 ? '0' : '') + hour;
	var min = date.getMinutes();
	min = (min < 10 ? '0' : '') + min;
	var sec = date.getSeconds();
	sec = (sec < 10 ? '0' : '') + sec;
	var date = hour + ':' + min + ':' + sec + ' - ';
	return date;
}

var fs = require('fs')

var onlineWork = true;
exports.online = function online(error){

	let time = Date.now();
	if(error) time = 1044058151602

	let files = {
		time
	}

	if(onlineWork) fs.writeFileSync(__dirname + '/json/online.json', JSON.stringify(files, null, 4));
	if(error) onlineWork = false;
}

exports.checkOnline = function checkOnline(){
	let time_now = Date.now();
	let online_time = JSON.parse(fs.readFileSync(__dirname + '/json/online.json', 'utf8'));
		online_time = online_time.time;

		let duration_online_time = time_now - online_time;
			duration_online_time = duration_online_time > 180000 ? false : true;
	return duration_online_time;
}

exports.logs = function(data, title){
	var logs = JSON.parse(fs.readFileSync(__dirname + '/json/logs.json', 'utf8'));
	logs[title] = data;

	fs.writeFileSync(__dirname + '/json/logs.json', JSON.stringify(logs, null, 4));
}

exports.saveLogsOrders = function(data, type){
	if(!type){
		fs.appendFileSync(__dirname + '/json/logsOrders.json', JSON.stringify(data, null, 4));
	} else {
		fs.appendFileSync(__dirname + '/json/error.json', JSON.stringify(data, null, 4));
	}
}

exports.error = function(data){
	fs.appendFileSync(__dirname + '/json/error.json', JSON.stringify(data, null, 4));
}

exports.success = function(data){
	data.time = new Date();
	fs.appendFileSync(__dirname + '/json/success.json', JSON.stringify(data, null, 4));
}

exports.max_phone_balance = function max_phone_balance(phone_wallets, system){

		var phones = Object.keys(phone_wallets);
		var wallet = [];

		for(let i = 0; i < phones.length; i++){
			wallet[i] = phone_wallets[phones[i]];
		}

	return Math.max.apply(null, wallet);
}

exports.saveWallet = function(phone_wallets, system){
	var wallets = JSON.parse(fs.readFileSync(__dirname + '/json/wallets.json', 'utf8'));
	wallets[system] = phone_wallets;
	fs.writeFileSync(__dirname + '/json/wallets.json', JSON.stringify(wallets, null, 4));
}

exports.messages = function messages(){
	var msg = JSON.parse(fs.readFileSync(__dirname + '/json/messages.json', 'utf8'));

	return msg;
}

exports.min_max_wallet = function min_max_wallet(amount, system){
	amount = amount * 1.01; //fee qiwi
	
	var all_system_wallets = JSON.parse(fs.readFileSync(__dirname + '/json/wallets.json', 'utf8'));
	var	phone_wallets = all_system_wallets[system];
	
	var phones = Object.keys(phone_wallets);
	var wallets = {};
	var good_balances = [];
	let k = 0;
		for(let i = 0; i < phones.length; i++){

			let balance = phone_wallets[phones[i]];

			if(balance > amount){
				wallets[k] = phones[i];
				good_balances[k] = phone_wallets[phones[i]];
				k = k + 1;
			}

		}

	let foundBalance = Math.min.apply(null, good_balances);

	let phone = wallets[good_balances.indexOf(foundBalance)];

		phone_wallets[phone] = phone_wallets[phone] - amount;
		all_system_wallets[system] = phone_wallets;

	if(phone) fs.writeFileSync(__dirname + '/json/wallets.json', JSON.stringify(all_system_wallets, null, 4));
	

	return phone;

}

exports.find_free_phone = function find_free_phone(id, system){
	     let phone = false;
         var all_phones_check = {};

         var myPhones = JSON.parse(fs.readFileSync(__dirname + '/json/wallets.json', 'utf8'));
         	 myPhones = myPhones[system];
             myPhones = walletSortDown(myPhones);

         var objPhones = Object.keys(myPhones);
         
         var activeOrders = JSON.parse(fs.readFileSync(__dirname + '/json/activeOrders.json', 'utf8'));
         //var activeOrders = activeOrdersAnyType[system];

         var allID = Object.keys(activeOrders);

         for(let i = 0; i < objPhones.length; i ++){
            let check_phone = objPhones[i];

                all_phones_check[check_phone] = false;

            for(let b = 0; b < allID.length; b ++){
               if(check_phone === activeOrders[allID[b]].phone){
                  all_phones_check[check_phone] = true
               }
            }
         }
         console.log(all_phones_check)

         let stop = false;
         for(let c = 0; c < objPhones.length; c ++){
            if(!all_phones_check[objPhones[c]] && !stop){
               phone = objPhones[c];
               stop = true;
            }
         }

         activeOrders[id] = {'messages': false, 'phone': phone, 'released': false};

         //activeOrdersAnyType[system] = activeOrders;

         fs.writeFileSync(__dirname + '/json/activeOrders.json', JSON.stringify(activeOrders, null, 4));
         console.log(phone)
         return phone;
}

function walletSortDown(data){
	
let phones = Object.keys(data)
var massive_phones = [];

	for(let i = 0; i < phones.length; i++){
		let phone = phones[i]
		let amount = data[phone];
		massive_phones.push([
		phone, amount
		])
	}

	var down_phones = (function(){
	return massive_phones.sort(function(a, b) {
    			 return a[1] - b[1];
				});
	})();

	var objPhones = {};

		for(let c = 0; c < down_phones.length; c++){
			let objPhone = down_phones[c][0]
			objPhones[objPhone] = down_phones[c][1]
		} 
	return objPhones
}

exports.getMatchList = function getMatchList(nick, type){

	let boolen = false;
	var list = JSON.parse(fs.readFileSync(__dirname + '/json/' + type + 'list.json', 'utf8'));

	for(let i = 0; i < list.length; i ++ ){
		if(list[i] === nick){
			boolen = true
		}
	} return boolen;
}

exports.myList = function myList(nick, type){

	var list = JSON.parse(fs.readFileSync(__dirname + '/json/'+type+'list.json', 'utf8'));

		list.push(nick)

	fs.writeFileSync(__dirname + '/json/'+type+'list.json', JSON.stringify(list, null, 4));
}

exports.whiteList = function whiteList(nick){

	var list = JSON.parse(fs.readFileSync(__dirname + '/json/whitelist.json', 'utf8'));

		list.push(nick)

	fs.writeFileSync(__dirname + '/json/whitelist.json', JSON.stringify(list, null, 4));
}

exports.activateWalletCheck = function activateWalletCheck(){
	var walletFile = JSON.parse(fs.readFileSync(__dirname + '/json/wallets.json', 'utf8'));
	//walletFile['time'] = Date.now() / 1000;
	walletFile['active'] = true;
	fs.writeFileSync(__dirname + '/json/wallets.json', JSON.stringify(walletFile, null, 4));
}


