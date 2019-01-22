/* import npm  libraries */
var fetch = require('node-fetch');
var cheerio = require('cheerio');
var moment = require('moment');
/* import custom functions */
var writer = require('./writer');
var logger = require('./logger');

const path_url = 'http://shirts4mike.com/shirts.php';
const base_url = 'http://shirts4mike.com/';

let scrape_urls = [];
let final_set = [];

function handleErrors(response) {

    if (response.ok) {
      resolve(response);
    } else if (response.status > 300) {
      reject({e: response.status, origin: 'Some server error'})
    } else if (response.status < 200){
      reject({e: response.status, origin: 'Unauthorized'})
    } else {
      reject({e: response.status, origin: 'default'})
    }
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
          resolve();
        } catch(e){
          const origin = 'fetching urls from homepage';
          reject({ e, origin });
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
      resolve();
    } catch(e){
      const origin = 'scraping data from t-shirt pages';
      reject({ e, origin });
    }
  });
}

function write_file(){
  writer.write(final_set)
}

async function main(){
  /* */
  try {
    await fetch1()
  } catch(error){
    console.log('catching f1: ', error.origin)
    logger.write(error)
  }
  /* */
  try {
    await fetch2()
  } catch(error){
    console.log('catching f2: ', error)
    logger.write(error)
  }
  /* */
  write_file()
}

main();

