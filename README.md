# MongoDB change streams load test

### Prerequisites
* Node.js 8+ 
* MongoDB 3.6+
  * Create a database called `streamtest`, create a collection called `chat`

### Setup

`$ yarn install` or `$ npm install`

By default, localhost:27017 will be used. Override if needed:

`$ export MONGO_URL=mongodb://...`

### Run

It requires two consoles. A listener script and a load script will run in parallel.

##### 1. Start the listener. It creates change stream cursors and listens to events.

`$ node watch.js`

##### 2. Start the load test. It inserts documents into the database.

`$ node send.js`

Let it run for a while (a minute or so). Both scripts should output the number of 
documents they send/receive.

##### 3. Kill the load test with ctrl+C.
 
##### 4. Wait for the listener receive all events.
 
##### 5. Kill the listener with ctrl+C.
 

