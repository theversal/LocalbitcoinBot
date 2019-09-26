var request = require('request');

var login = require('./login').login


var proxy = login.proxy;
	
if(proxy) request = request.defaults({'proxy': proxy});

var other = require('./other')


exports.buy = buy_treatment;
exports.sell = sell_treatment;

var client = login.account.login;


exports.getDashboard = function getDashboard(url, callback, spot, buy_price){
	//url = 'https://localbitcoins.net/buy-bitcoins-online/usd/perfect-money/.json'
	var orders = [];

	let options = {url: url, json: true, timeout: 25000}

	return new Promise((resolve, reject) => {
		request(options, function(err, res, body){
			if(!err && body && body.data && body.data.ad_list){
				let data = body.data.ad_list;

				data.forEach(function(element){
					//console.log(element.data.profile)
					let user = {}
					user['name'] = element.data.profile.username
					user['price'] = Number(element.data.temp_price)
					user['high'] = Number(element.data.max_amount)
					user['low'] = Number(element.data.min_amount)

					if(user['name'] !== client){
			    		orders.push(user)
			    	}
				})

				if(orders && orders.length > 5){

					resolve( callback(orders, spot, buy_price) );
				} else {

					console.log('err price url ' + url)
					resolve(0)
				}
			} else {

				console.log('Error link: ' + url)
				resolve(0)
			}
		})
	})
}

//let buy_price = getBuyDashboard();



function buy_treatment(orders, spot){


	var down_orders = orders

	let limit = timeFilter(false)

	let av_price = get_average_custom_massive(down_orders, 14000, 7000, 1) + 500;

	spot = spot * 1.03;

	let price = 0;
	let train = true;

	for(let i = 0; i < orders.length; i++){
		let plus = av_price / down_orders[i]['price'];
		if(plus > 1 && train){
			price = down_orders[i]['price'];
			train = false;
		}
	}
	other.logs(orders, 'buy')

	//console.log('Buy price ' + price)
	price = price + 2;
	return price;
}




function get_average_custom_massive(massive, limit, highLimit, users){
	var custom_massive = [];
	let x = 0;
	for(let i = 1; i < massive.length; i++){
		if(massive[i]['low'] < limit && massive[i]['high'] >= highLimit){
			custom_massive[x] = massive[i];
			x = x + 1;
		}
	}

  	let average = 0
  	let summ_price = 0;


	let dlina = custom_massive.length > users ? users : custom_massive.length;

	for(let y = 0; y < dlina; y ++){
		let price = custom_massive[y]['price'];

    	summ_price += price;
	}
	average = summ_price / dlina;

	return average;
}

// SELL 


//////////////////////////////////////
//////////////////////////////////////
//////////////////////////////////////




function sell_treatment(orders, spot, buy_price){


	var down_orders = (function(){

		let onlyprice = [];
		for(let i = 0; i < orders.length; i++){
			onlyprice[i] = orders[i]['price'];
		}

		return onlyprice.sort(function(a, b) {
	    			 return a - b;
					});

		
	})();

	let limit = timeFilter(true)

	let av_price = get_average_custom_massive(orders, 9000, 2100, limit) - 500;

	let profit = 0.99 * 0.98 / buy_price * 0.99 * av_price;

	if(profit < 1.008) av_price = (1.008 / (0.99 * 0.98 / buy_price * 0.99)) - 500;

	spot = spot * 1.015;
	if(spot && av_price < spot) av_price = spot;

	let price = 0;
	let train = true;
		av_price = av_price * 1.0;
	for(let i = 0; i < orders.length; i++){
		let plus = down_orders[i] / av_price;
		//console.log('plus: ' + plus + ' down: ' + down_orders[i])
		if(plus > 1 && train){
			price = down_orders[i];
			train = false;
		}
	}
	//price = price * 1.02

	if(price === 0) price = av_price;
	price = Number(price.toFixed(2));

	other.logs(orders, 'sell')
	//console.log('Sell price ' + price)
	price = price - 2;
	return price;
}



function timeFilter(type){

    var date = new Date();
    var hour = date.getHours();
    var date = hour; 

    let limit = 2;
    if(!type) limit = 2;
    if(hour < 10) limit = 1;

    return limit
}


exports.getSpotPrice = function getSpotPrice(){
	return new Promise((resolve, reject) => {
		
  		let options = {
   				url: 'https://blockchain.info/ticker',
   				timeout: 1000,
  			}
		request.get(options, function(err, res, body){
			if(body && !err){
				let data = JSON.parse(body)
		
				resolve(data['RUB'].buy)
			} else {
			
				resolve (false)
			}
		})
	})
}





