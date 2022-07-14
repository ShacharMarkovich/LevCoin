const Users = require('../models/user.model');
const cryptobank = require("../models/cryptoBank");
const chain = new cryptobank.Chain();

function updateUser(req, res) {
  Users.findByIdAndUpdate(
    req.body._id,
    {
      $set: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
        isAdmin: req.body.isAdmin,
        isConfirmed: req.body.isConfirmed,
        password: req.body.password,
      }
    }).then(
      (user) => {
        res.send({success: true, msg: "User updated"});
      }).catch(
      (err) => {
        res.status(500).send({success: false, msg: "Server error"});
      }
  )
}

 function deleteUser(req, res) {
  Users.findByIdAndDelete(req.body._id, function (err) {
    if (err) {
      res.status(500).send({success: false, msg: "Server error"});
    } else {
      res.status(200).send({success: true, msg: "User deleted"});
    }
  })
}

 function confirmUser(req, res) {
  Users.findByIdAndUpdate(
    req.body._id,
    {
      $set: {
        isConfirmed: true,
      }
    }
  ).then(
    (user) => {
      if(req.body.amount) {
        chain.systemInsertBlock( req.body.amount, user.publicKey);
        console.log("System inserted Transaction " + String(req.body.amount) + " to user " + user.username);
      }
      res.send({success: true, msg: "User confirmed"});
    }
  )
}

 function getPendingUsers(req, res) {
  Users.find({isConfirmed: false}, function (err, users) {
    if (err) {
      res.status(500).send({success: false, msg: "Server error"});
    } else if (!users) {
      res.status(400).send({success: false, msg: "Users do not exist"});
    } else {
      users.forEach(function (user) {
        delete user.privateKey;
        delete user.publicKey;
        delete user.password;
      })
      res.status(200).send({success: true, users: users});
    }
  })
}

module.exports = {
  updateUser,
  deleteUser,
  confirmUser,
  getPendingUsers
}
