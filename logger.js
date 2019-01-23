/* fs is required to read/write to a file */
const fs = require('fs');
/* moment is required for the timestamp */
var moment = require('moment');
/* zone is required for the abbreviation eg. PST inside timestamp */
var zone = require('moment-timezone');
/* if an error is thrown in the code write the error message with timestamp to a file */
function write(error){
  /* write the line to file as a stream with the flag for appending */
  let stream = fs.createWriteStream("scraper-error.log", {flags:'a'});
  /* compose the timestamp as stated in the project spec */
  /* [Tue Feb 16 2016 10:02:12 GMT-0800 (PST)] */
  let stamp = '['+ moment().toString() + ' ' + zone.tz(zone.tz.guess()).zoneAbbr() + ']';
  /* write */
  stream.write(stamp + ' ' + error + "\n");
  /* close the stream connection */
  stream.end();
}
module.exports = { write };