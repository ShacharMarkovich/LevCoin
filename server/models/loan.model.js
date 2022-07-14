var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URL);


var loanSchema = new Schema({
  info: String,
  sendBy: String, //username
  sendTo: String, //username
  dateCreated: Date,
  amount: Number,
  dateToReturn: Date,

  isConfirmed: {Boolean, default: false},
  isRejected: {Boolean, default: false},
  isReturned: {Boolean, default: false},
  returnedDate: Date,
});

module.exports = mongoose.model('Loan', loanSchema);
