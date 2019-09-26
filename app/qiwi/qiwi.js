var other = require('./other')

exports.getWallet = getWallet;

function getWallet(Acc){
  return new Promise((resolve, reject) => {

    Acc.getBalance((err, balance) => {

      if(err || !balance || !balance.accounts) {
  	    console.log('qiwi err: ' + err)
        console.log(balance)
  	    resolve(false)
        /*hanle error*/
      } else {

        balance = balance.accounts;
        let rub;
        for(let i = 0; i < balance.length; i++){
          if(balance[i].currency === 643 && !!balance[i].balance){
            rub = balance[i].balance.amount;
          }
        }
        resolve(rub);
      }
    })
  })
}

exports.getHistory = function getHistory(Acc, amount, timeOrder, code){

  return new Promise((resolve, reject) => {
    let paymant_sum = 0;
	  Acc.getOperationHistory({rows: 25, operation: "IN"}, (err, operations) => {

      let data = Object(operations);
      data = data.data;
      data.reverse()
      if(!err && data){
        for(let i = 0; i < data.length; i ++){
          let comment = data[i].comment;

          if(comment){
            comment = comment.replace(/ /g, '');
            comment = Number(comment)
          } 
    	    code = Number(code)

          let time = data[i].date;
    	    time = new Date(time);
          time = time.getTime();

          let qiwi_amount = Number(data[i].sum.amount);

          let currency = data[i].sum.currency === 643;
          let provider = data[i].provider.id === 7;
          let timeCheck = time >= timeOrder;
          let qiwiLimit = qiwi_amount >= 7999;
          //console.log(currency + ' limit ' + qiwiLimit + ' provider ' + provider + ' time ' + timeCheck + ' code ' )
          if(currency && qiwiLimit && provider && timeCheck && comment === code){
            paymant_sum += qiwi_amount;
          }
        }
        console.log('QIWI HISTORY: Code: ' + code + ' paymant_sum: ' + paymant_sum)
        if(paymant_sum >= amount){
          resolve(true);
        } else {
          resolve(false)
        }
      } else {
        other.error({err, operations})
        resolve(false)
      }
    })
  })
}



exports.send = function send(Acc, amount, number){

	return new Promise((resolve, reject) => {
	
	  if(number.indexOf('8') === 0) number = number.replace('8', '7');
    if(number.indexOf('9') === 0 && number.length === 10) number = '7' + number;
	  Acc.toWallet({ amount: amount, comment: '', account: number }, (err, data) => {

  	  if(!err && data.id){
        console.log(data)
        if(data.transaction.state.code === 'Accepted'){
          setTimeout(function() {resolve(data)}, 1000);
        } else {
          setTimeout(function() {resolve(false)}, 1000);
        }
  		
  	  } else {
  		  console.log(data)
  		  setTimeout(function() {resolve(false)}, 1000);
  	  }
 
    })
	})
}

var fs = require('fs')
exports.getCheck = function getCheck(Acc, id){
console.log(id)
  return new Promise((resolve, reject) => {
    Acc.getCheck(id, function(err, body){
      var image = new Buffer(body, 'base64');
      resolve(image)
    });
  })
}










