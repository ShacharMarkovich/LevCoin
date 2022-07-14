const crypto = require("crypto");
const fs = require("fs");
const db = require("../utils/Chain.MongoDBConnection")

class Transaction {
  static increment_id = 0
  constructor(amount, senderPublicKey, receiverPublicKey) {
    this.amount = amount;
    this.senderPublicKey = senderPublicKey;
    this.receiverPublicKey = receiverPublicKey;
    this.transactionId = Transaction.increment_id++;
  }

  // convert the data of the class to json so that
  // it can be converted into a hash
  toString() {
    return JSON.stringify(this);
  }
}

class Block {
  constructor(previousHash, transaction, timestamp = Date.now()) {
    this.previousHash = previousHash;
    this.transaction = transaction;
    this.timestamp = timestamp;
  }

  getHash() {
    const json = JSON.stringify(this);
    const hash = crypto.createHash("SHA256");
    hash.update(json).end();
    return hash.digest("hex");
  }

  toString() {
    return JSON.stringify(this);
  }
}

function getHash(obj) {
  const json = JSON.stringify(obj);
  const hash = crypto.createHash("SHA256");
  hash.update(json).end();
  return hash.digest("hex");
}

class Chain {
  constructor() {
    if (!Chain.inited) {
    }
    this.systemPublic = fs.readFileSync("system_keys\\public.key", "utf8");
    this.systemPrivate = fs.readFileSync("system_keys\\private.key", "utf8");
    this.chain = db;
    //this.chain = [new Block("", new Transaction(100, "temp", "temp"))];
  }
  systemInsertBlock(amount, receiverPublicKey) {
    const transaction = new Transaction(
      amount,
      this.systemPublic,
      receiverPublicKey
    );
    const shaSign = crypto.createSign("SHA256");
    // add the transaction json
    shaSign.update(transaction.toString()).end();
    // sign the SHA with the private key
    const signature = shaSign.sign(this.systemPrivate);
    this.insertBlock(transaction, this.systemPublic, signature);
  }

  async getSumOfMoneyInChain() {
    let sum = 0;
    let res = await this.chain.Find({'transaction.senderPublicKey': this.systemPublic})
    await res.forEach((block) => {
      sum += block.transaction.amount;
    })
    return sum;
  }

  async getBalanceAndTransactions(wallet) {
    let balance = 0;
    let Transactions = [];
    const res = await this.chain.Find({$or: [{'transaction.senderPublicKey': wallet.publicKey}, {'transaction.receiverPublicKey': wallet.publicKey}]});

    await res.forEach((block) => {
      if (block.transaction.senderPublicKey === wallet.publicKey) {
        balance -= block.transaction.amount;
      } else if (block.transaction.receiverPublicKey === wallet.publicKey) {
        balance += block.transaction.amount;
      }
      Transactions.push(block.transaction);
    })
    return {balance, Transactions};
  }

  getPreviousBlockHash() {
    // sending the entire block itself
    return getHash(this.chain.GetLastBlock());
  }

  async insertBlock(transaction, senderPublicKey, sig) {
    const count = await db.Count()
    if (count == 0) {
      this.chain.Insert(new Block("", new Transaction(0, "temp", "temp")))
    }
    else {
      Transaction.increment_id = count;
    }
    // create verifier
    const verify = crypto.createVerify("SHA256");
    // add the transaction JSON
    verify.update(transaction.toString());

    // Verify it with the sender's public key
    const isValid = verify.verify(senderPublicKey, sig);

    if (isValid) {
      const block = new Block(this.getPreviousBlockHash(), transaction);
      console.log("Block added", block.toString());
      await this.chain.Insert(block);
    }
  }
}

class Wallet {
  constructor(privateKey = null, publicKey = null) {
    if (!privateKey && !publicKey) {
      const keys = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {type: "spki", format: "pem"},
        privateKeyEncoding: {type: "pkcs8", format: "pem"},
      });
      this.privateKey = keys.privateKey;
      this.publicKey = keys.publicKey;
    }
    else{
      this.privateKey = privateKey
      this.publicKey = publicKey;
    }
  }

  send(chain, amount, receiverPublicKey) {
    const transaction = new Transaction(
      amount,
      this.publicKey,
      receiverPublicKey
    );
    const shaSign = crypto.createSign("SHA256");
    // add the transaction json
    shaSign.update(transaction.toString()).end();
    // sign the SHA with the private key
    const signature = shaSign.sign(this.privateKey);
    chain.insertBlock(transaction, this.publicKey, signature);
  }
}

module.exports.Chain = Chain;
module.exports.Wallet = Wallet;
module.exports.Transaction = Transaction;
