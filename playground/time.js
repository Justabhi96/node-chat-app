const moment = require('moment');

var date = moment();

console.log(date.format('Do MMM, YYYY'));//18th Apr, 2018
console.log(date.format('MMM YYYY'));//Apr 2018
console.log(date.format('YYYY'));//2018