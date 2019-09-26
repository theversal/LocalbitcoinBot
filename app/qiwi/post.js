var fs = require('fs')
var other = require('./other');
var local = require('./local')
var login = require('./login').login

exports.close = function close() {

	var res = JSON.parse(fs.readFileSync(__dirname + '/json/openOrders.json', 'utf8'));

	if(res.openOrders.buyOrder.visible || res.openOrders.sellOrder.visible){
	//console.log(other.Time() + 'Process of closing orders')

		let cash = other.max_phone_balance(res.wallet,  res.openOrders.sellOrder.online_provider) * 0.98 || 0;
			cash = Math.floor(cash)
		let buy_default_price = res.openOrders.buyOrder.price_equation,
		    sell_default_price = res.openOrders.sellOrder.price_equation;

		let	buy_max_amount = res.openOrders.buyOrder.max_amount;

		//console.log('Close info - Sell Price: ' + res.sell + ' Buy price: ' + res.buy + ' Qiwi: ' + cash)

		let buy_options = {
			system: res.openOrders.buyOrder.online_provider,
			id: res.openOrders.buyOrder.ad_id,
			type: 'ONLINE_BUY',
			price: buy_default_price,
			amount: buy_max_amount,
			min: login.account.buyOrderOptions.minOpenOrderAmount,
			visible: false
		}

		let sell_options = {

			system: res.openOrders.sellOrder.online_provider,
			id: res.openOrders.sellOrder.ad_id,
			type: 'ONLINE_SELL',
			price: sell_default_price,
			amount: login.account.sellOrderOptions.maxOpenOrderAmount,
			min: login.account.sellOrderOptions.minOpenOrderAmount,
			visible: false
		}

		return price_edit(buy_options, sell_options, res);
		
	} else { 
		console.log(other.Time() + 'Order has already closed')
		return empty()

	}
}


exports.update = function update(res){
		
		let cash = other.max_phone_balance(res.wallet, res.openOrders.sellOrder.online_provider) * 0.98;
			cash = Math.floor(cash)
		//let order_buy_max_amount = Number(res.openOrders.buyOrder.max_amount)
		let buy_max_amount = cash.toFixed(0);
		let activeBuyCount = getCount(res.activeOrders)

		let dataBuyMinAmount = login.account.buyOrderOptions.minOpenOrderAmount;

		if(activeBuyCount > 0 ) buy_max_amount = 1001;

		var price = getMarketPrice(res.buy, res.sell, res.spotPrice)
	
		let profit = 0.99 * 0.98 / price.buy * 0.99 * price.sell;
			profit = (profit - 1).toFixed(3)
		console.log(other.Time() + 'Amount: ' + cash + ' rub ' + ' Spot: ' + res.spotPrice + ' Sell: ' + price.sell + ' Buy: ' + price.buy + ' %' + profit);
		
		let buyVisible = res.openOrders.buyOrder.visible;
		let sellVisible = res.openOrders.sellOrder.visible;
		
		if(!buyVisible && buy_max_amount <= Number(dataBuyMinAmount)) buyVisible = true;

		let buy_options = {
			system: res.openOrders.buyOrder.online_provider,
			id: res.openOrders.buyOrder.ad_id,
			type: 'ONLINE_BUY',
			price: price.buy,
			amount: buy_max_amount,
			min: dataBuyMinAmount,
			visible: login.account.buyOrderOptions.visible
		}


		let sell_options = {
			system: res.openOrders.sellOrder.online_provider,
			id: res.openOrders.sellOrder.ad_id,
			type: 'ONLINE_SELL',
			price: price.sell,
			amount: login.account.sellOrderOptions.maxOpenOrderAmount,
			min: login.account.sellOrderOptions.minOpenOrderAmount,
			visible: login.account.sellOrderOptions.visible
		}

		if(buy_max_amount > 10000 && !sellVisible) {
			
			sellVisible = true;
			sell_options.visible = false;
		} else if(buy_max_amount > 10000 && sellVisible){
			sellVisible = false;
			sell_options.visible = false;
		}

		if(!buy_options.visible) buyVisible = true;
		if(!sell_options.visible) sellVisible = true;

		let visible = buyVisible && sellVisible;

		let activeSellCount = getCount(res.activeOrders, true);

		if(activeSellCount >= 2 && sellVisible && buyVisible){
			sell_options.visible = false; 
			visible = false
		} else if(activeSellCount >= 2 && !sellVisible && buyVisible){
			visible = true
		}

		if(activeBuyCount === 0 && (res.walletActive || !visible)){
			console.log('ABCount ' + activeBuyCount + ' Wallet: ' + res.walletActive + ' Vissible: ' + visible)
			if(!visible && activeBuyCount > 0) buy_options['amount'] = Number(dataBuyMinAmount) + 1;

			return price_edit(buy_options, sell_options, res)

		} else {

			return price_update(buy_options, sell_options, res)
		}
}

function price_update(buy, sell, res){

	return new Promise((resolve, reject) => {

		local.ad_equation(buy)
		.then((status) => {
			local.ad_equation(sell)
			.then((status) => {
				resolve(status)
			})
		})
	})
}

function price_edit(buy, sell, res){

	return new Promise((resolve, reject) => {

		local.edit(buy)
		.then((status) => {
			if(status) res.openOrders.buyOrder.visible = buy.visible;

			local.edit(sell)
			.then((status) => {
			
				if(status) res.openOrders.sellOrder.visible = sell.visible;
				console.log('price_edit')
				fs.writeFileSync(__dirname + '/json/openOrders.json', JSON.stringify(res, null, 4));
				resolve(status)
			})
		})
	})
}

function getCount(orders, is){
	let active = 0;
	for(let i = 0; i < orders.length; i++){
		let type = orders[i].data.is_buying;
		let hasPayed = orders[i].data.payment_completed_at;
		let marker = type && !hasPayed;
		
		if(is) marker = !type && !orders[i].data.disputed_at;
	
		if(marker) active += 1;
		
	} return active;
}


function getMarketPrice(buy, sell, spot){
	if(buy > spot){
		//buy = spot;
	}

	if(sell < spot){
		sell = spot;
	}

	return {buy, sell};
}

function empty(){
	return new Promise((resolve, reject)=>{
		resolve(true) 
	})
}
exports.getCount = getCount;


