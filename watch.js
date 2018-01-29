const MongoClient = require('mongodb').MongoClient;
const Chance = require('chance');

const DB_NAME = 'streamtest';
const APP_NAME = "StreamTest";

// Simulate connected clients on a chat service backend server
const CLIENT_COUNT = 1;

// Each client creates N change streams, they listen to conversations in rooms
// Number of change stream cursors = CLIENT_COUNT * JOIN_COUNT
const JOIN_COUNT = 50;

// Number of all possible rooms
const ROOM_COUNT = 50;

let mongoConnection = null;
let listeners = [];
let lastSecondMessageCount = 0;
let lifetimeMessageCount = 0;
let sumDelay = 0;
let largestDelay = 0;

class Listener {
  constructor(collection, clientId, roomCount, joinCount, onReceived) {
    this.collection = collection;
    this.chance = new Chance();

    // Generate list of rooms to subscribe to
    let rooms = this.generateRoomsToJoin(roomCount, joinCount);
    console.log(`Client ${clientId} joining rooms: ${rooms}`);

    this.cursors = rooms.map(roomId => {
      let cursor = collection.watch([
        {$match: {"fullDocument.room": roomId}},
      ]);
      cursor.stream().on("data", doc => {
        lastSecondMessageCount++;
        lifetimeMessageCount++;
        let delay = Date.now() - doc.fullDocument.created;
        sumDelay += delay;
        if (largestDelay < delay) largestDelay = delay;
      });
      return cursor;
    });
  }

  close() {
    this.cursors.forEach(cursor => cursor.close());
  }

  // Creates a list of random unique integers in the [1..roomCount] range
  generateRoomsToJoin(roomCount, joinCount) {
    let rooms = [];
    for (let i = 0; i < roomCount; i++) {
      rooms.push({id: i + 1, random: this.chance.integer()});
    }
    rooms.sort((a, b) => a.random - b.random);
    return rooms.slice(0, joinCount).map(x => x.id);
  }
}

// Print some stats every second
function stat() {
  if (lastSecondMessageCount > 0) {
    console.log("Messages received:", lastSecondMessageCount);
    lastSecondMessageCount = 0;
  }
}

// Quit and dump stats
function quit() {
  listeners.forEach(client => client.close());
  if (mongoConnection !== null) mongoConnection.close();

  console.log("Received count:", lifetimeMessageCount);
  console.log("Average delay (ms):", sumDelay / lifetimeMessageCount);
  console.log("Largest delay (ms):", largestDelay);

  console.log("bye");
  process.exit();
}

async function main() {
  let MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
  mongoConnection = await MongoClient.connect(MONGO_URL, {appname: APP_NAME});
  console.log("Connected successfully to server");

  const db = mongoConnection.db(DB_NAME);
  let chatCollection = db.collection("chat");

  // Create clients
  for (let i = 0; i < CLIENT_COUNT; i++) {
    let listener = new Listener(chatCollection, i, ROOM_COUNT, JOIN_COUNT, (x) => {lastSecondMessageCount += x;});
    listeners.push(listener);
  }

  setInterval(stat, 1000);
  console.log("Listening...");
}

main().catch(er => {
  console.error(er);
  process.exit();
});

// Go on forever until killed
setInterval(() => {}, 30000);
process.on('SIGINT', quit);