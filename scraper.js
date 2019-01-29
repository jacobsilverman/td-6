/* scraper file crawls the web pages */
/* all packages > 1,000 downloads  ✅ */
/* all packages updated in the last six months ✅ */
/* fetch to get html as response */
var fetch = require('node-fetch');
/* cheerio will parse html similar to jquery */
var cheerio = require('cheerio');
/* moment will get the scrape time */
var moment = require('moment');
/* scraper consumes user defined functions */
var writer = require('./writer');
var logger = require('./logger');
/* url and file path constants */
const path_url = 'http://shirts4mike.com/shirts.php';
const base_url = 'http://shirts4mike.com/';
/* arrays for storing scraped data */
let scrape_urls = [];
let final_set = [];
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
    /* see writer.js */
    writer.write(final_set)
  } catch(error){
    /* any error in the nested code will bubble up to here */
    /* exceeds expectations: write error to log file */
    /* see logger.js */
    logger.write(error)
  }
}

main();

// return file