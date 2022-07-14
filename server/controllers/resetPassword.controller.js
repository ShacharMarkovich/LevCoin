var users = require('../models/user.model') 
const crypto = require('crypto');
const login = require('../config/mail-config.json')
const nodemailer = require('nodemailer');
let transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: login.username,
      pass: login.password,
    }
  });

exports.forgotPost = async (req, res, next) => {

    const token = crypto.randomBytes(20).toString('hex');
    console.log(req.body.username);
    const user = await users.findOne({ username: req.body.username });
    if (!user) {
        console.log('no user found');
      return res.send({success: true, msg: 'if user exists email sent'});
    }
  
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    console.log(user);
    await users.findByIdAndUpdate(
      user._id,
      {
        $set: {
          resetPasswordToken: token,
          resetPasswordExpires: Date.now() + 3600000
        }
      },
      { new: true },
    ).exec()
    const resetEmail = {
      to: user.email,
      from: login.username,
      subject: 'Node.js Password Reset',
      text: `
        You are receiving this because you (or someone else) have requested the reset of the password for your account.
        Please click on the following link, or paste this into your browser to complete the process:
        https://${req.headers.host}/reset/${token}
        If you did not request this, please ignore this email and your password will remain unchanged.
      `,
    };
  
    await transport.sendMail(resetEmail);
    console.log('user found');
    return res.send({success: true, msg: 'if user exists email sent'});
  }

exports.tokenGet = async (req, res) => {
  const user = await users.findOne({resetPasswordToken: req.params.token})
  if (user.resetPasswordExpires < Date.now()) 
    return res.send('Password reset token is invalid or has expired.')
  
  if (!user) {
      console.log('no token found');
      return res.send({success: false, msg: 'invalid token'});
  }

  res.send(`
    <form action="/reset/${req.params.token}" method="post">
        <input type="password" name="password" placeholder="New Password" required>
        <button type="submit">Reset Password</button>
    </form>
    `);
  }
  exports.tokenPost = async (req, res) => {
    const user = await users.findOne({resetPasswordToken: req.params.token})
    console.log(user);
  
    if (!user) {
      req.send('Password reset token is invalid or has expired.');
      return res.redirect('/');
    }
    if (user.resetPasswordExpires < Date.now()) 
    return res.send('Password reset token is invalid or has expired.')
  
    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await users.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: user.password,
          resetPasswordToken: user.resetPasswordToken,
          resetPasswordExpires: user.resetPasswordExpires
        }
      },
      { new: true },
    ).exec();
    const resetEmail = {
      to: user.email,
      from: login.username,
      subject: 'Your password has been changed',
      text: `
        This is a confirmation that the password for your account "${user.email}" has just been changed.
      `,
    };
  
    await transport.sendMail(resetEmail);
    res.send(`Success! Your password has been changed.`);
  }