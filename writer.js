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
/* open/close to creating file */
const close = promisify(fs.close);
const open = promisify(fs.open);
/* moment for getting date/time */
var moment = require('moment');
/* library for writing objects to csv */
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
/* global variable for blocking code */
let lock;
/* locking function for blocking code */
function checkLock(){
  return new Promise(resolve => {

    const tick = () => {
      setTimeout(() => {
        if(lock) {
          //console.log('Locked retrying...');
          return tick();
        }

        resolve();
      }, 100);
    }

    tick();

  });
}
/* check if a directory exists */
async function checkDirectoryExists(dataPath) {

  if(lock)
    await checkLock();

  lock = true;
  // console.log('Locking', dataPath);

  try {
    await lstat(dataPath);
    /* directory does exist */
    lock = false;
    // console.log('Existing ', dataPath);
    // console.log('end lock');
  } catch(e) {
    /* directory does not exist */
    console.log('Creating ', dataPath);
    await mkdir(dataPath);
    lock = false;
    // console.log('end lock');
  }
}

async function writeFile(filePath, final_set){
  if(lock)
    await checkLock();

  lock = true;
  // console.log('writing')
  // console.log('final_set ',final_set)
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
  const records = [
    {title: 'One',  price: 'Yay, Yaya', imageURL: 'foo',URL: 'bar', time: 'hello'},
    {title: 'Two',  price: 'French, English', imageURL: 'bar',URL: 'goo', time: 'world'},
  ];
  // console.log('records ',records)

  try {
    csvWriter.writeRecords(final_set)       // returns a promise
      .then(() => {
        console.log('...Done');
      });
    lock = false;
    // console.log('Writing ', filePath);
    // console.log('end lock');
  } catch(e){
    lock = false;
    console.log('Unable to write ', e);
    // console.log('end lock');
  }
}

async function write(final_set){
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

module.exports = { write };