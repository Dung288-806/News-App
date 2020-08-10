const moment = require('moment')

console.log(new Date(Date.now()));

const date = new Date();


 const date1 = `${moment().format("YYYY-MM-DD")} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`


//  console.log(date1);