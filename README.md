# LocalbitcoinBot

Все настройки производятся в файле account.json            
Можно ввести сколько угодно киви аккаунтов, бот их будет использовать поочередно.     
Необходимо создать два локал app на странице https://localbitcoins.net/accounts/api/      
и выпустить для каждого киви номера свой токен.       
В графе login указать свой никнейм в локалбиткоинс.          
Также ордера на бай и селл  уже должны быть созданы на локале.           
Бот сам не создаст их, он будет каждые пол минуты редактировать цену.               
 в настройках ордера sell your bitcoins online должна стоять галочка Display reference        
и reference type Numbers only                    
У вас должна стоять версия node 10.15 и выше. Установить можно через оффициальный сайт https://nodejs.org/en/

Запуск программы  
  
INSTALL Don't forget to run npm install in the folder of the bot to install the node modules  

для Mac и Unix подобных систем  
  
Install Node.js - 32 bit version for 32 bit systems or 64 bit version for 64 bit systems (4.0.0 minimum).  
through terminal/console  
run npm install in folder if it's in your desktop (cd ./desktop/localbitcoinBot then 'npm install')  
add your data to the file account.json  
and then run 'node qiwi' or run qiwi.sh   
   
Windows instruction   
Install Node.js  
Download with node modules (download the localbitcoinBot.zip file) [here](https://github.com/RobinsonNikolay/LocalbitcoinBot/releases)  
add your data to the file account.json  
Double-click qiwi.bat.  
  
for other payment methods add me telegramm @RobinsonNikolay  
perfect money; paypal; advcash; webmoney; payeer; yandex
