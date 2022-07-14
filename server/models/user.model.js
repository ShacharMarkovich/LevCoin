var passportLocalMongoose = require('passport-local-mongoose');
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URL);

const User = new Schema({
  username: String,
  password: String,
  email: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: Boolean,
  isConfirmed: Boolean,
  publicKey: String,
  privateKey: String,
  firstName: String,
  lastName: String,
}, {collection: 'users'});
User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
