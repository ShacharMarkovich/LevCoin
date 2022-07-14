require('dotenv').config()
const express = require('express');
const router = express.Router();
const passport = require('passport')
const userController = require('../controllers/user.controller');
const adminController = require('../controllers/admin.controller');
const resetPasswordController = require('../controllers/resetPassword.controller');
const authorize = require('../utils/jwt-auth')

const userWithoutPassword = (user) => {
  return {
    username: user.username,
    email: user.email,
    isConfirmed: user.isConfirmed,
    isAdmin: user.isAdmin,
    firstName: user.firstName,
    lastName: user.lastName,
  }
}

// refered only when login is failed
router.get('/loginFailed', (req, res) => {
  res.send({success: false, msg: "Login failed"})
});
// login with username and password, required fields: username, password
router.post('/login', passport.authenticate('local', {failureRedirect: 'loginFailed', session: true}),
  (req, res) => {
    res.send({
      success: true, user: userWithoutPassword(req.user)
    })
  });

router.get('/logout', userController.logout) //V

// register with username, password, email, firstName, lastName, required fields: username, password, email, firstName, lastName
router.post('/register', userController.register) //V

router.get('/', (req, res) => {
  res.send({success: true, msg: "api root"})
}) // V

//user
// get user by id, required fields: _id
router.get('/user/details', authorize(), userController.getDetails) //V
// update user by id in session, optional fields: firstName, lastName, email, username, password
router.post('/user/updateDetails', authorize(), userController.updateDetails)
// get balance of user by id in session
router.get('/user/getBalance', authorize(false, true), userController.getBalance) //V
// get transactions of user by id in session
router.get('/user/getTransactions', authorize(false, true), userController.getTransactions)
// get transaction of user by user id in session, transaction id in url
router.get('/user/getTransaction/:transactionId', authorize(false, true), userController.getTransactions)
// make a transaction, required fields: amount, usernameToSend
router.post('/user/makeTransactions', authorize(false, true), userController.makeTransaction)
// send a loan request, required fields: amount, usernameToSend
router.post('/user/requestLoan', authorize(false, true), userController.sendLoanRequest)
// get loan requests of user by id in session
router.get('/user/getLoans', authorize(false, true), userController.getLoans)
// reject a loan request, required fields: loanId
router.post('/user/rejectLoan', authorize(false, true), userController.rejectLoan)
// confirm a loan request, required fields: loanId
router.post('/user/rejectLoan', authorize(false, true), userController.confirmLoan)


//admin
// get all pending users
router.get('/admin/getPendingUsers', authorize(true, true), adminController.getPendingUsers) //V
// confirm a user, required fields: userId
router.post('/admin/confirmUser', authorize(true, true), adminController.confirmUser) //V
// delete a user, required fields: userId
router.post('/admin/deleteUser', authorize(true, true), adminController.deleteUser) //V
// update a user, required fields: userId, optional fields: firstName, lastName, email, username, password
router.post('/admin/updateUser', authorize(true, true), adminController.updateUser)  //V

//reset password
router.post('/forgot', resetPasswordController.forgotPost);
router.get('/reset/:token', resetPasswordController.tokenGet);
router.post('/reset/:token', resetPasswordController.tokenPost);


// router.get('/', homeController.homePage) //VVV
//
// router.get('/about', aboutController.aboutPage) //V
//
// router.get('/catalog',authorize(), catalogController.catalogPage) //V
//
// router.get('/logout',authorize(),  (req,res) => {
//     req.logout()
//     res.send('{"success":true}')})
//
// router.get('/users',authorize(true), usersController.usersPage)
// router.post('/updateuser',authorize(), usersController.updateUser)
// router.post("/getUserModal",authorize(), usersController.getUserModal)
// router.post('/adduser', authorize(true), usersController.addUser) //V
// router.post('/deleteuser', authorize(true), usersController.deleteUser) //V
// router.post('/register', dbController.register) //V
// router.get('/loginFailed', (req,res) => {res.send({success:false, msg:"Login failed"})});
// router.post('/login',passport.authenticate('local',{ failureRedirect: 'loginFailed', failureMessage: true }), (req,res) => {res.send({
//     success : true, user :{role : req.user.role, username : req.user.username}})});
//
// router.post("/uploaditem", authorize(true),upload.single('image'), uploadImageController.uploadImage)
// router.post("/deleteitem", authorize(true), uploadImageController.deleteItem)
//
// // router.post('/testAddUser', testDbController.testAddUser)
// // router.post('/testDeleteUser',authorize(), testDbController.testDeleteUser)
// // router.get('/testGetUser', testDbController.testGetUser)
// // router.get('/testGetUsers',authorize(["admin","worker"]), testDbController.testGetUsers)
// // router.post('/testUpdateUser', testDbController.testUpdateUser)
//
// router.get('/test', (req,res) => {res.send("TEST")});


module.exports = router
