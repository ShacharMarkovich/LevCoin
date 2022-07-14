const MongoClient = require('mongodb').MongoClient;

const url = process.env.MONGODB_URL;

exports.Count = async function () {
  const client = await MongoClient.connect(url, {useNewUrlParser: true});
  const db = client.db('cryptoBank');
  const collection = db.collection('chain');
  return await collection.countDocuments();
};

exports.Insert = async function (block) {
  const client = await MongoClient.connect(url, {useNewUrlParser: true});
  const db = client.db('cryptoBank');
  const collection = db.collection('chain');
  return await collection.insertOne(block);
};

exports.Find = async function (query) {
  const client = await MongoClient.connect(url, {useNewUrlParser: true});
  const db = client.db('cryptoBank');
  const collection = db.collection('chain');
  return await collection.find(query).toArray();
}
exports.GetLastBlock = async function () {
  const client = await MongoClient.connect(url, {useNewUrlParser: true});
  const db = client.db('cryptoBank');
  const collection = db.collection('chain');
  return await collection.find().sort({_id: -1}).limit(1).toArray();
}

exports.GetTransactionId = async function (id) {
  const client = await MongoClient.connect(url, {useNewUrlParser: true});
  const db = client.db('cryptoBank');
  const collection = db.collection('chain');
  return await collection.find({'transaction.transactionId': wallet.publicKey}).toArray();
}
