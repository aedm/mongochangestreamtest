const Chance = require('chance');

const SENDS_PER_SECOND = 10;
const SEND_BATCH = 10;

class Messenger {
  constructor(collection, roomCount) {
    this.collection = collection;
    this.roomCount = roomCount;
    this.interval = null;
    this.chance = new Chance();
    this.statInterval = null;
  }

  start() {
    if (!this.interval) {
      this.sentCount = 0;
      this.sendStart = Date.now();
      this.interval = setInterval(() => this.send(), 1000 / SENDS_PER_SECOND);
      this.statInterval = setInterval(() => this.stat(), 1000);
    }
    console.log("Started");
  }

  stop() {
    let elapsed = Date.now() - this.sendStart;
    clearInterval(this.interval);
    clearInterval(this.statInterval);
    this.interval = null;
    this.statInterval = null;

    console.log("Stopped.");
    console.log("Avg messages/sec:", this.sentCount / elapsed * 1000);
  }

  send() {
    let docs = [];
    for (let i=0; i<SEND_BATCH; i++) {
      docs.push({
        room: this.chance.integer({min: 1, max: this.roomCount}),
        //msg: this.chance.sentence({words: 1}),
        created: Date.now(),
      });
    }
    this.collection.insertMany(docs);
    this.sentCount += SEND_BATCH;
  }

  stat() {
    console.log("Messages sent:", this.sentCount);
    this.sentCount = 0;
  }
}


module.exports = {
  Messenger
};