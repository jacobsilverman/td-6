const fs = require('fs');
var moment = require('moment');
var zone = require('moment-timezone');

function write(error){
  console.log('error ',error)
  let stream = fs.createWriteStream("log.txt", {flags:'a'});
  // let  = moment().format("ddd MMM DD YYYY HH:mm:ss ");
  let stamp = moment().toString() + ' ' + zone.tz(zone.tz.guess()).zoneAbbr();
  if (error.origin){
    stream.write(stamp + ' Problem ' + error.origin + ' ' + error.e + "\n");
    stream.end();
  } else {
    stream.write(stamp + ' ' + error.e + "\n");
    stream.end();
  }
}
module.exports = { write };