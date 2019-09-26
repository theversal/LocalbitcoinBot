
var treatment = require('./orders'),
    price = require('./price'),
    local = require('./local'),
    other = require('./other'),
    post = require('./post');

 var fs = require('fs');
 var globalOrders = false
 var walletActive = true,
 	 priceActive = true;

var provider = 'QIWI'

function setupChecking(){
console.log('================')
console.log(other.Time() + '[QIWI] Checking dashboard started')
other.online()
other.logs(Date.now(), 'time')

	local.dashboard(true, provider).then(function(result) {
		if(result){
			console.log(other.Time() + result.length + ' - active orders');
			globalOrders = result;

			switch (true){
				case (result.length > 0):
				activeOrders(result);
				break;
				default:
				again();
			}

		} else {
			console.log(other.Time() + 'error active orders');
			globalOrders = false;
			again()	
		}
	})
}

function again(){
setTimeout(function(){
	setupChecking()
}, 1000 * 15);
}

function activeOrders(orders){

	console.log(other.Time() + 'Orders: ' + '\n--------------');
	other.saveLogsOrders(orders)

	var active_orders = {};
	var order = []
	var history = JSON.parse(fs.readFileSync(__dirname + '/json/history.json', 'utf8'));
	for(let i = 0; i < orders.length; i++){
		let id = orders[i].data.contact_id;

		active_orders[id] = {'messages': false, 'phone': false, 'released': false};
	
		if(history[id]){
			active_orders[id] = history[id];
		}

		
	}
	let buyCount = post.getCount(orders)
	let sellCount = post.getCount(orders, true)

	if(buyCount > 0 || sellCount > 0) walletActive = true;
	
	fs.writeFileSync(__dirname + '/json/activeOrders.json', JSON.stringify(active_orders, null, 4));
	treatment.tressClients(orders, again)
}



var openOrders = undefined;

setupChecking()
setTimeout(function() {getAdvertisments();}, 1000 * 15); 


function getAdvertisments(){
	local.adgets(provider)
	.then((ads) => {
		if(ads){

			var res = JSON.parse(fs.readFileSync(__dirname + '/json/openOrders.json', 'utf8'));
				res.openOrders = ads;
				fs.writeFileSync(__dirname + '/json/openOrders.json', JSON.stringify(res, null, 4));

			getPrice()

		} else {
			setTimeout(function() { getAdvertisments() }, 1000 * 10);
			
		}
	})
}


function getPrice(){
	
	let string_provider = provider.toLowerCase();
		string_provider = string_provider.replace('_', '-');

	let url_buy = 'https://localbitcoins.net/sell-bitcoins-online/rub/'+ string_provider +'/.json'
	let url_sell = 'https://localbitcoins.net/buy-bitcoins-online/rub/'+ string_provider +'/.json'

var p = async function p() {
  let spotPrice = await price.getSpotPrice();
  let buy = await price.getDashboard(url_buy, price.buy, spotPrice);
  let sell = await price.getDashboard(url_sell, price.sell, spotPrice, buy);
  let wallet = await getWallet(provider);

  return {buy, sell, wallet, spotPrice};
}

p().then(res => {

	var savedOrders = JSON.parse(fs.readFileSync(__dirname + '/json/openOrders.json', 'utf8'));

	res.activeOrders = globalOrders;
	res.openOrders = savedOrders.openOrders;
	res.walletActive = priceActive;

	let cash = res.wallet;
	let buy_max_amount;
	let online = other.checkOnline();


	let price_check = res.sell > res.buy && res.sell / res.buy > 1 && res.buy > 500000 && res.sell > 500000;
	//price_check = false
	
	if(price_check && res.spotPrice && res.openOrders && globalOrders && cash && online){

			post.update(res).then((status) =>{

				if(res.walletActive && status) priceActive = false;
				priceTimeOut()
			})

	} else {
		
		console.log('Price_check: ' + price_check + ' Online: ' + online + ' Sell: ' + res.sell + ' Buy: ' + res.buy)
		other.error(res)

		post.close().then((st) => priceTimeOut())
	} 

})

}



function getWallet(provider){

	var walletFile = JSON.parse(fs.readFileSync(__dirname + '/json/wallets.json', 'utf8'));
	let buyCount;
	let sellCount;
	if(globalOrders) {
		buyCount = post.getCount(globalOrders);
		sellCount = post.getCount(globalOrders, true);
	}
  	if(buyCount === 0 && sellCount === 0 && walletActive){

  		return treatment.wallet(provider)
  		.then((wallet)=>{
  			
  			if(wallet){
  				other.saveWallet(wallet, provider)
  				priceActive = true;
  				walletActive = false;
  				return wallet;
  			} else {
  				return false
  			}
  		});

  	} else {

  		return walletFile[provider];
  	}
}


function priceTimeOut(){
setTimeout(function(){
	getPrice()
}, 1000 * 10);
}






