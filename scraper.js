/* scraper file crawls the Mike's Webpage */
/* all packages > 1,000 downloads  ✅ */
/* all packages updated in the last six months ✅ */
/* fetch to get html as response */
var fetch = require('node-fetch');
/* cheerio will parse html similar to jquery */
var cheerio = require('cheerio');
/* moment will get the scrape time */
var moment = require('moment');
/* timezone is required for the abbreviation eg. PST inside timestamp */
var zone = require('moment-timezone');
/* fs library for read/write to files */
const fs = require('fs');
/* promisify library for returning promises */
const { promisify } = require('util');
/* lstat library for checking if file exists */
const lstat = promisify(fs.lstat);
/* mkdir library for checking if directory exists */
const mkdir = promisify(fs.mkdir);
/* path library for getting working directory */
const path = require('path');
/* library for writing objects to csv */
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/* url and file path constants */
const path_url = 'http://shirts4mike.com/shirts.php';
const base_url = 'http://shirtsmike.com/';
/* arrays for storing scraped data */
let scrape_urls = [];
let final_set = [];
/* checkLock is a helper function for blocking the program from proceeding when it is waiting for operations
 like file write */
/* global variable for blocking thread */
let lock;
/* locking function for blocking thread */
function checkLock(){
  return new Promise(resolve => {

    const tick = () => {
      setTimeout(() => {
        if(lock) {
          return tick();
        }

        resolve();
      }, 100);
    }

    tick();

  });
}
/* checkDirectoryExists check for a folder called ‘data’.  */
async function checkDirectoryExists(dataPath) {
  if(lock)
    await checkLock();

  lock = true;

  try {
    /* directory does exist */
    await lstat(dataPath);
    /* If the folder does exist, the scraper should do nothing. */
    lock = false;
  } catch(e) {
    /* directory does not exist */
    await mkdir(dataPath);
    /* If the folder does not exist, create one. */
    lock = false;
  }
}
/* writeFile writes the results object to csv */
async function writeFile(filePath, final_set){
  if(lock)
    await checkLock();

  lock = true;

  const csvWriter = createCsvWriter({
    path: filePath,
    header: [
      {id: 'title', title: 'TITLE'},
      {id: 'price', title: 'PRICE'},
      {id: 'imageURL', title: 'IMAGEURL'},
      {id: 'URL', title: 'URL'},
      {id: 'time', title: 'TIME'},
    ]
  });

  try {
    /* final_set contains data to write */
    csvWriter.writeRecords(final_set) // returns a promise
      .then(() => {
        console.log('...Done');
      });
    lock = false;
  } catch(e){
    lock = false;
    console.log('Unable to write ', e);
  }
}
/* writer fn calls the dir and fs operations in order and catches errors */
async function writer(final_set){
  /* this is the dir path for file */
  const dataPath = path.join(__dirname, 'data');
  /* this is the path including date as filename */
  const filePath = path.join(dataPath, new moment().format('YYYY-MM-DD') + '.csv');
  try {
    await checkDirectoryExists(dataPath);
    await writeFile(filePath, final_set);
  } catch(e){
    console.log('There was an error in the write fn ', e);
  }
}

/* if an error is thrown in the code write the error message with timestamp to a file */
function write_log(error){
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

/* reusable fn to handle fetch errors such as 404 */
function handleErrors(response) {
    if (!response.ok) {
      throw new Error('response not ok')
    }
    return response;
}
/* visit the website and scrape urls for the next crawl  */
function fetch_urls(){
  return fetch(path_url)
    /* check for non-200 code */
    .then(handleErrors)
    /* parse the response into jQuery-like object */
    .then(response => {
      return response.text()
    })
    /* retrieve the desired data from $object */
    .then(data => {
      return new Promise((resolve,reject) => {
        try {
          var $ = cheerio.load(data);
          /* get the urls to crawl from the fetch response */
          $('.products a').each(function () {
            scrape_urls.push($(this).attr('href'));
          });
          /* resolve if everything is ok */
          resolve();
        } catch(e){
          /* reject to main.catch if error */
          reject(e);
        }
      });
    })
}
/* function to get the data from the 8 tee-shirt pages */
async function fetch_data(){
  return new Promise(async (resolve,reject) => {
    try {
      /* loop will run for each url from fetch_urls */
      for (const url of scrape_urls) {
        await fetch(base_url + url)
          .then(handleErrors)
          .then(response => {
            return response.text()
          })
          .then(data => {
            var $ = cheerio.load(data);
            const $shirt_img = $('.shirt-picture img');
            let item_obj = {
              title: $shirt_img.attr('alt'),
              price: $('h1 .price').text(),
              imageURL: $shirt_img.attr('src'),
              URL: base_url + url,
              time: moment().format("HH:mm")
            };
            final_set.push(item_obj);
          })
      }
      resolve();
    } catch(e){
      reject(e);
    }
  });
}
/* this is the program entry point */
async function main(){
  try {
    await fetch_urls();
    await fetch_data();
    /* write data object to file as csv */
    /* see writer fn */
    writer(final_set)
  } catch(error){
    /* any error in the nested code will bubble up to here */
    /* exceeds expectations: write error to log file */
    /* see write_log fn */
    write_log(error)
  }
}

main();

// return file