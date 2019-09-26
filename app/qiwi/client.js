
var local = require('./local');
var fs = require('fs')
var tress = require('tress')
var other = require('./other')
var qiwi = require('./qiwi')

var login = require('./login').login
var qiwi = require('./qiwi')

var requestFile = {'QIWI': qiwi};

var Qiwi = require('../node-qiwi-api').Qiwi;

var qiwi_wallets = function(){
  var data = {}
  for(let i = 0; i < login.qiwi.length; i++){
    var clientQiwi = new Qiwi(login.qiwi[i]['token'], false);
    let phoneQiwi = login.qiwi[i]['number'];
    data[phoneQiwi] = clientQiwi;
  }
  return data;
}()

var wallets = {'QIWI': qiwi_wallets};

var msg = other.messages()


class LBC{
	 constructor(offer) {
	 	 this.tradeoffer = offer.data;
         this.id = offer.data.contact_id;
         this.type = offer.data.is_buying;
         this.history = JSON.parse(fs.readFileSync(__dirname + '/json/history.json', 'utf8'));
         this.timeData = JSON.parse(fs.readFileSync(__dirname + '/json/activeOrders.json', 'utf8'));
         this.system = offer.data.advertisement.payment_method;
         this.sWallet = wallets[this.system]
      }

      checkPayStatus(){

      	if(this.tradeoffer.payment_completed_at && !this.tradeoffer.released_at){
          return this.buyFinal()
            
      	} else if(this.tradeoffer.released_at || this.timeData[this.id].pay){ //в случае если уже им оплачено то можно закрывать сделку
      		return local.markpaid(this.id);

      	} else if(!this.tradeoffer.payment_completed_at && !this.timeData[this.id].pay){
      		console.log(this.id + ': ' + 'я еще не отправил деньги');
          
          if(this.tradeoffer.account_details){
      		  return this.send_cash_toClient();
          } else {
            return this.message(msg.wrong).then((res) => local.cancelOrder(this.id))
          }

      	} else { 
      		return this.info('Pay Status Empty');

      	}
      }

      buyFinal(){

        let time = new Date(this.tradeoffer.created_at);
            time = time.getTime() / 1000;

          let timeNow = Date.now() / 1000;
          let openDisput = (timeNow - time) > 3600;

          if(openDisput && !this.tradeoffer.disputed_at){
            console.log(this.history[this.id])

            let payPhone = this.history[this.id].payPhone;
            let transactionid = this.history[this.id].transactionid;

             return requestFile[this.system].getCheck(this.sWallet[payPhone], transactionid)
              .then((image)=> {
                 fs.writeFileSync(__dirname + '/image/' + this.id +'.png', image);
                 return local.openDispute(this.id).then((res)=> this.info('success open dispute')) 
              })

          } else if(this.tradeoffer.disputed_at){ 
            return this.info('dispute has opened')

          } else {
            let timeMsg = this.history[this.id].timeMsg / 1000;
            let itsTimeMsg = (timeNow - timeMsg) > 500;

            if(itsTimeMsg){
              return this.message(msg.end).then((res) => {

              this.history[this.id].timeMsg = timeNow * 1000;
              this.save(this.history[this.id])
                    
              return true;

              })

            } else {
              return this.info('not need open dispute') 

            }
          } 
        }
      

      informClient(info){

       return this.message(info)

        .then((res) =>{
          if(res){

            this.save({'info': true})
            return this.info('end')

          } else {

            return this.info('error msg about confirm')
          }
        })
      }

      send_cash_toClient(){

      	this.phone = this.tradeoffer.account_details.phone_number;
      	this.amount = this.tradeoffer.amount;
      	
		    let msgProccess = (msg.send + this.phone + ' Количество: ' + this.amount + ' руб.');
        let payPhone = other.min_max_wallet(this.amount, this.system);

        console.log(msg.process + this.phone + ' from this phone: ' + payPhone);

        return this.message(msgProccess)

           .then((text) => requestFile[this.system].send(this.sWallet[payPhone], this.amount, this.phone))
           .then((data) => {

		         	if(data){

		         		console.log(this.id + ': ' + ' money was send');

		     		     this.save({'pay': true, 'payPhone': payPhone, 'transactionid': data.transaction.id, 'timeMsg': Date.now(), 'disputeImage': false});

		         		return this.message(msg.success)
                   .then((status) =>  local.markpaid(this.id))
                   .then((status)=>{
                      return 'Marked as Payed';
                    })

		     	    } else {
                return this.message(msg.error) // error send cash, we need inform our client
                  .then((o)=> local.markpaid(this.id))
                  .then((e)=> {
                    other.online(true) // now all active ads will be closed 
                    return this.info('error send cash, order was canceled')
                  })
              }
            })
      }
/*
      async sellAntiFraud(){
        
        let ip = this.tradeoffer.buyer.countrycode_by_ip,
            ip_phone = this.tradeoffer.buyer.countrycode_by_phone_number,
            nick = this.tradeoffer.buyer.username;

        
        let blocked = other.getMatchList(nick, 'black'),
            whiteUser = other.getMatchList(nick, 'white');
            

        let trade = (ip === ip_phone || ip === 'RU') && !blocked;

        if(whiteUser || trade) {

          trade = true

        } else if(!this.history[this.id]){

          let userInfo = await local.userInfo(nick);

          if(userInfo && userInfo.identity_verified_at){
            trade = true;
            other.myList(nick, 'white');
          }
        }

        if((trade && !this.timeData[this.id].ip) || this.timeData[this.id].phone){

          return this.checkSellStatus()

        } else if(!this.history[this.id] || (!this.timeData[this.id].phone && !this.timeData[this.id].ip)){
          let blockMsg = blocked === true ? msg.blocked : msg.country;
          return this.message(blockMsg)

            .then((res)=> {

              if(!blocked) other.myList(nick, 'black');

              if(ip === null) ip = true;

              this.save({'ip': ip, 'blocked': blocked});
              return true;
            })

        } else {

          return this.info('Not RF resident') 
        }
      }
*/    async sellAntiFraud(){
        return this.checkSellStatus()
      }

      checkSellStatus(){

        let code = this.tradeoffer.reference_code;
        let amount = Number(this.tradeoffer.amount);

        if(!this.history[this.id] || !this.history[this.id].phone){
         	// проверка есть в истории этот трейд если нет то отправим нужную инструкцию
          let phone = other.find_free_phone(this.id, this.system);

          if(phone){
            return this.send_information_toSeller(amount, phone, code)

          } else if(!this.history[this.id] || !this.history[this.id].msg){
            return this.message(msg.wait) // sending info that all phones in process

            .then((res)=>{

              this.save({'msg': true});
              return true;
            })

          } else {

            return this.info('все реквезиты заняты')
          }

        } else if(this.history[this.id] && !this.tradeoffer.released_at && !this.tradeoffer.disputed_at){
            // если мы уже отправили сообщение но не закрыта сделка, надо первоночально проверить отправил ли он деньги
          return this.checkHistory(code, amount)

            .then((status) =>  this.sellFinal(status))

        } else if(this.tradeoffer.disputed_at){ 
          return this.info('dispute has opened')

        } else if(this.tradeoffer.released_at){
          return (this.id + ': ' + 'We have already released cash')

        } else {
          return (this.id + ': ' + 'Nothing happened there')
        }
      }

      sellFinal(status){

        if(status){
          return (this.id + ' Order compeletd')

        } else { 
          // need open diput ? 
          let time = new Date(this.tradeoffer.created_at);
              time = time.getTime() / 1000;

          let timeNow = Date.now() / 1000;
          let openDisput = (timeNow - time) > 3600;

              if(!this.tradeoffer.disputed_at && openDisput){
                console.log('open disput')
                return local.openDispute(this.id).then((res)=>{
                  return(this.id + ' - success open dispute')

                   })

              } else {
                return (this.id + ' - waiting payment')

              } 
        }
      }


      send_information_toSeller(amount, phone, code){
          let leftText = 'Привет. \nОтправь деньги на номер с КОДОМ В КОММЕНТАРИИ К ПЛАТЕЖУ. \nПринимаю только с QIWI на QIWI. \nПлатежи с банковских карт и терминалов запрещены.\n\n'
          let rightText = '\n\nНе забудь указать КОД в комментарии. \nBe sure to include the CODE in the payment comment.'
          let toUser =  leftText + amount + ' руб. \nWallet Number: '+ phone + '\nКомментарий: ' + code + rightText;
         //отправляем это сообщение toUser
         
         return this.message(toUser).then((text) => {
            if(text){
               this.save({'messages': true, 'phone': phone, 'released': false, 'time': Date.now()});
            } else { 
               console.log('Error sending message to #' + this.id)
            }
            return text;
         })
         // здесь мы сохраняем, что мы отправили сообщение, чтобы не было 100 сообщений
      }


      checkHistory(code, amount){
      	let time = this.history[this.id].time;
        let phone = this.history[this.id].phone;
   

        return requestFile[this.system].getHistory(this.sWallet[phone], amount, time, code).then((status) => {
               // если status true значит отправил если false значит нет
          if(status && !this.tradeoffer.released_at){
            console.log(this.id + ': ' + 'Закрываем сделку');

            return local.markreleased(this.id).then((res) => {

              if(res){
                this.history[this.id].released = true;
                this.save(this.history[this.id]);

                return this.message(msg.close)
                .then((res) => {

                  return true;
                })
              } else {

                return true;
              }
            })
                  
                  // нужно закрыть сделку
          } else {
                  
            console.log(this.id + ': ' + 'Code: ' + code + ' Amount: ' + amount + ' Status: ' + status)
            console.log(this.id + ': ' + 'Клиент еще не отправил деньги');
            return false;
                  // нет нужды делать какие либо действия
          }
        })
      }

      message(text){
        
        return new Promise((resolve, reject) => {
          local.message(text, this.id, function(error, data) {
             
            if(data && !data.error){
              console.log('Succes: message');
              setTimeout(function() {resolve(true)}, 500);
            } else {
              console.log('Error send message')
              setTimeout(function() {resolve(false)}, 500);    
            }
          })
        })
      }

      info(text){

        return new Promise((resolve, reject) => {
          resolve(this.id + ': ' + text)
        })
      }

      save(did){

      	  this.history = JSON.parse(fs.readFileSync(__dirname + '/json/history.json', 'utf8'));
          this.history[this.id] = (did);
      	            
		    fs.writeFileSync(__dirname + '/json/history.json', JSON.stringify(this.history, null, 4));
      }


}

exports.LBC = LBC;

exports.wallet = function wallet(system){

  var data = {};
  
  var sWallet = wallets[system]
  var objWallet = Object.keys(sWallet);

    return new Promise((resolve, reject) =>{
      var q = tress(function(phone, callback){
      
         requestFile[system].getWallet(sWallet[phone]).then((balance)=>{

           data[phone] = balance;

            callback()
          })
    })

    q.drain = function(){

        resolve(data)
    } 

    q.push(objWallet);
  })
}









