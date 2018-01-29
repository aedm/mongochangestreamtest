const MongoClient = require('mongodb').MongoClient;
const {Listener} = require('./listener');
const {Messenger} = require('./messenger');

const URL = 'mongodb://localhost:27017';
const DB_NAME = 'streamtest';
const APP_NAME = "StreamTest";

const CLIENT_COUNT = 1;
const ROOM_COUNT = 50;
const JOIN_COUNT = 50;

let mongoConnection = null;
let listeners = [];
let messageCount = 0;

function stat() {
  if (messageCount > 0) {
    console.log("Messages received:", messageCount);
    messageCount = 0;
  }
}

function quit() {
  listeners.forEach(client => client.close());
  if (mongoConnection !== null) mongoConnection.close();
  console.log("bye");
  process.exit();
}

async function main() {
  mongoConnection = await MongoClient.connect(URL, {appname: APP_NAME});
  console.log("Connected successfully to server");
  const db = mongoConnection.db(DB_NAME);
  // await db.collection("hello").insertOne({x: 1});

  // Create clients
  let chatCollection = db.collection("chat");
  for (let i = 0; i < CLIENT_COUNT; i++) {
    let listener = new Listener(chatCollection, i, ROOM_COUNT, JOIN_COUNT, (x) => {messageCount += x;});
    listeners.push(listener);
  }

  // Create message generator
  let messenger = new Messenger(chatCollection, ROOM_COUNT);

  // Setup triggers
  db.collection("control").watch([
    {$match: {}},
  ]).stream().on("data", () => {
    messenger.trigger();
  });

  setInterval(stat, 1000);
  console.log("Clients created.");
}

main().catch(er => console.error(er));

// Go on forever until killed
setInterval(() => {}, 30000);
process.on('SIGINT', quit);