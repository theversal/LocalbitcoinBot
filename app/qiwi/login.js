var fs = require('fs')
exports.login = new Login;


function Login(){
  this.account = JSON.parse(fs.readFileSync('./account.json', 'utf8'));
  this.qiwi = qiwiMassive(this.account.qiwi)
  this.localFirst = this.account.localbitcoinApiKeyFirst;
  this.localSecond = this.account.localbitcoinApiKeySecond;
  this.proxy = myProxy(this.account.proxy);
}

function qiwiMassive(data){
  var qiwiAccounts = Object.keys(data)
  qiwiAccounts = qiwiAccounts.filter(el => el.length > 0)
  var qiwiData = [];

  for(let i = 0; i < qiwiAccounts.length; i++){
    let number = qiwiAccounts[i];
    let token = data[number];
      
    qiwiData.push({number, token})
  }
  return qiwiData
}

function myProxy(data){
  if(data.address.length > 0){
    return "http://" + data.login + ":" + data.password + "@" + data.address + ":" + data.port;
  } else {
    return false;
  }
}
//var data = new Login()