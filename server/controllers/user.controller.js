const crypto = require("crypto");
const {Wallet}  = require("../models/cryptoBank");

const Users = require('../models/user.model');
const Loans = require('../models/loan.model');

const cryptobank = require('../models/cryptobank');
const chain = new cryptobank.Chain();

function register(req, res) {
  Users.findOne({username: req.body.username}, function (err, user) {
    if (err) {
      res.status(500).send({success: false, msg: "Server error"});
    } else if (user) {
      res.status(400).send({success: false, msg: "User already exists"});
    } else {
      Users.findOne({email: req.body.email}, function (err, user) {
        if (err) {
          res.status(500).send({success: false, msg: "Server error"});
        } else if (user) {
          res.status(400).send({success: false, msg: "Email already exists"});
        } else {
          const keys = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: {type: "spki", format: "pem"},
            privateKeyEncoding: {type: "pkcs8", format: "pem"},
          });
          Users.create(
            {
              username: req.body.username.toLowerCase(),
              password: req.body.password,
              email: req.body.email,
              isAdmin: false,
              isConfirmed: false,
              publicKey: keys.publicKey,
              privateKey: keys.privateKey,
              firstName: req.body.firstName,
              lastName: req.body.lastName,
            }
          ).then((user) => {
            res.send({success: true, msg: "User created"});
          })
        }
      })
    }
  });
}

function logout(req, res) {
  req.logout((err) => {
    if (err) {
      res.status(500).send({success: false, msg: "Server error"});
    } else {
      res.status(200).send({success: true, msg: "Logged out"});
    }
  })
}

// req.body = {info, sendTo, amount}
function sendLoanRequest(req, res) {
  Loans.create({
    info: req.body.info,
    sendTo: req.body.sendTo,
    amount: req.body.amount,
    sendBy: req.user.username,
    dateCreated: new Date().getDate(),
  }).then((loan) => {
    res.send({success: true, msg: "Loan request sent"});
  })
}


function rejectLoan(req, res) {
  Loans.findByIdAndUpdate(req.body.id, {
    $set: {
      isRejected: true
    }
  }).then(
    (loan) => {
      res.send({success: true, msg: "Loan rejected"});
    }
  )
}

function confirmLoan(req, res) {
  Loans.findByIdAndUpdate(req.body.id, {
    $set: {
      isConfirmed: true
    }
  }).then(
    (loan) => {
      Wallet(req.user.privateKey, req.user.publicKey).send(loan.amount, loan.sendTo).then(() => {
        res.send({success: true, msg: "Loan Sent"});
      })
    }
  )
}

function getLoans(req, res) {
  Loans.find({$or: [{'sendBy': req.user.username}, {'sendBy': req.user.username}]}, function (err, loans) {
    if (err) {
      res.status(500).send({success: false, msg: "Server error"});
    } else {
      res.status(200).send({success: true, loans: loans});
    }
  })
}

// req.body = {username, amount}
function makeTransaction(req, res) {
  chain.getBalanceAndTransactions({publicKey: req.user.publicKey}).then((result) => {
    if (result.balance < req.body.amount) {
      res.status(400).send({success: false, msg: "Not enough balance"});
    }
    Users.findOne({username: req.body.username.toLowerCase()}, function (err, user) {
      if (err) {
        res.status(500).send({success: false, msg: "Server error"});
      } else if (!user) {
        res.status(400).send({success: false, msg: "User does not exist"});
      } else {
        const wallet = new cryptobank.Wallet(req.user.privateKey, req.user.publicKey);
        wallet.send(chain, req.body.amount, user.publicKey);
        chain.systemInsertBlock( req.body.amount, user.publicKey);
        res.status(200).send({success: true, msg: "Transaction created"});
      }
    });
  })
}

function getTransactions(req, res) {
  chain.getBalanceAndTransactions({publicKey: req.user.publicKey}).then((result) => {
      res.send({success: true, msg: result.Transactions});
    }
  )
}

function getBalance(req, res) {
  chain.getBalanceAndTransactions({publicKey: req.user.publicKey}).then((result) => {
      res.send({success: true, msg: result.balance});
    }
  )
}

getDetails = function (req, res) {
  Users.findOne({username: req.user.username},
    function (err, user) {
      if (err) {
        res.status(500).send({success: false, msg: "Server error"});
      } else if (!user) {
        res.status(400).send({success: false, msg: "User does not exist"});
      } else {
        delete user.privateKey;
        delete user.publicKey;
        delete user.password;
        res.status(200).send({success: true, user: user});
      }
    });
}

updateDetails = function (req, res) {
  Users.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      }}
  ).then(
    (user) => {
      res.send({success: true, msg: "User updated"});
    }
  )
}

module.exports = {
  register,
  logout,
  sendLoanRequest,
  rejectLoan,
  confirmLoan,
  getLoans,
  makeTransaction,
  getTransactions,
  getBalance,
  getDetails,
  updateDetails
}
