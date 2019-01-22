/*
  PROBLEM 1: Program your scraper to check for a folder called ‘data’. If the folder doesn’t exist, the scraper
   should create one. If the folder does exist, the scraper should do nothing. SOLUTION 1: Use the Console and File
    System Node.js APIs to check if the directory and file for today exist. If they do not then create them.
 */

/*
  PROBLEM 2: Your scraper should visits the website http://shirts4mike.com and use http://shirts4mike.com/shirts.php
   as single entry point to scrape information for 8 tee-shirts from the site, without using any hard-coded urls
    like http://www.shirts4mike.com/shirt.php?id=101. If you’re unsure of how to get started, try googling ‘node
     scraper’ to get a feel for what a scraper is and what it does. SOLUTION 2: For scraping content from the site,
      either use a scraping module or use the Cheerio module to create your own scraper. To create the CSV file, use
       a CSV creation module. I chose json2csv because it has At least 1,000 downloads and has been updated in the last
        six months.
 */

/* http://shirts4mike.com is served via HTTP (not HTTPS) so I decided to use HTTP Node.js API */

/* use system events such as Data Events, Completion Events, Error Events */

/*
httpRequest.onreadystatechange = () => {
  switch(httpRequest.readyState){
    case XMLHttpsRequest.DONE:
      console.log("Finished");
      break;
  }
}
  */

var fetch = require('node-fetch');
var cheerio = require('cheerio');
var moment = require('moment');
var writer = require('./writer');
var logger = require('./logger');

const path_url = 'http://shirts4mike.com/shirts.php';
const base_url = 'http://shirts4mike.com/';

let scrape_urls = [];
let final_set = [];

function handleErrors(response) {
  if (!response.ok) {
    console.log('throwing error')
    throw Error(response);
  }
  return response;
}

function fetch1(){
  return fetch(path_url)
    .then(handleErrors)
    .then(response => {
      return response.text()
    })
    .then(data => {
      return new Promise((resolve,reject) => {
        try {
          var $ = cheerio.load(data);
          $('.products a').each(function () {
            scrape_urls.push($(this).attr('href'));
          });
          console.log('fetch1 resolve()');
          throw Error('responses')
          resolve();
        } catch(e){
          console.log('fetch1 reject()', e);
          reject(e);
        }
      });
    })
}

async function fetch2(){
  return new Promise(async (resolve,reject) => {
    try {
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
      console.log('fetch2 resolve()');
      resolve();
    } catch(e){
      console.log('fetch2 reject()', e);
      reject(e);
    }
  });
}

function write_file(){
  writer.write(final_set)
}

function write_error(error,origin){
  /* check if the error is from the fetch or from a promise reject(e) */
  if(error.statusText){
    console.log('statusText ', error.statusText);
  }
  // console.log('error', error)
  logger.write(error)
}

async function main(){
  /* */
  try {
    await fetch1()
  } catch(e){
    write_error(e,'fetch1');
  }
  /* */
  try {
    await fetch2()
  } catch(e){
    write_error(e, 'fetch2');
  }
  /* */
  write_file()
}
main();

