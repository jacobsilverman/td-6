const fs = require('fs');
var moment = require('moment');
var zone = require('moment-timezone');

function write(error){
  let stream = fs.createWriteStream("scraper-error.log", {flags:'a'});
  let stamp = moment().toString() + ' ' + zone.tz(zone.tz.guess()).zoneAbbr();
  stream.write(stamp + ' ' + error + "\n");
  stream.end();
}
module.exports = { write };