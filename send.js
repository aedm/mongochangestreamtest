const MongoClient = require('mongodb').MongoClient;
const Chance = new require('chance')();

const DB_NAME = 'streamtest';
const APP_NAME = "Load";
const ROOM_COUNT = 50;
const SENDS_PER_SECOND = 10;
const SEND_BATCH = 10;

let mongoConnection = null;
let sentCount = 0;

function send(collection) {
  let docs = [];
  for (let i = 0; i < SEND_BATCH; i++) {
    docs.push({
      room: Chance.integer({min: 1, max: ROOM_COUNT}),
      created: Date.now(),
    });
  }
  collection.insertMany(docs);
  sentCount += SEND_BATCH;
}

function stat() {
  console.log("Messages sent:", sentCount);
  sentCount = 0;
}

function quit() {
  if (mongoConnection !== null) mongoConnection.close();
  console.log("bye");
  process.exit();
}

async function main() {
  let MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
  mongoConnection = await MongoClient.connect(MONGO_URL, {appname: APP_NAME});
  console.log("Connected successfully to server");

  const db = mongoConnection.db(DB_NAME);
  let chatCollection = db.collection("chat");

  setInterval(() => send(chatCollection), 1000 / SENDS_PER_SECOND);
  setInterval(stat, 1000);
}

main().catch(er => {
  console.error(er);
  process.exit();
});

// Go on forever until killed
setInterval(() => {}, 30000);
process.on('SIGINT', quit);