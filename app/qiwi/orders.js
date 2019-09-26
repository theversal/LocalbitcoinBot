var client = require('./client');
var tress = require('tress')
var LBC = client.LBC;


exports.tressClients = function tressClients(activeOrders, then){

	var q = tress(function(order, callback){
		new Client(order, callback);
	  })

	q.drain = function(){
		console.log(' ')
		then()

	} 

	q.push(activeOrders);


}


function wait(callback){
	setTimeout(function() {callback()}, 1000);
}

function Client(order, callback){
	
	var order = new LBC(order)

	    if(order.type){
         	order.checkPayStatus().then((res) => {
         		console.log('End Pay Client - ' + res + '\n--------------')
         		wait(callback);
         	})

         } else {
            order.sellAntiFraud().then((res) =>{
            	console.log('End Sell Client - ' + res + '\n--------------')
            	 wait(callback);
            })
           

         }
}

exports.wallet = function wallet(system){

	return client.wallet(system)
}

exports.getCheck = function getCheck(id, callback){
	return client.getCheck(id, callback);
}