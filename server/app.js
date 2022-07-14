require('dotenv').config()
const express = require("express")
var app = express();
const path = require('path')
const bodyparser = require('body-parser')
const errorHandler = require('./utils/error-handler')
var cookieParser = require('cookie-parser')
var {secret} = require('./config/jwt-config.json')
var mongoose = require('mongoose')
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var router = require('./routers/api.router')



app.use(require('express-session')({ secret: secret, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())
app.use(cookieParser())
app.use(router)
app.use(errorHandler);


//mongoose
mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log('Connected to MongoDB')
})


/// passport config
var User = require('./models/user.model');
passport.use('local', new LocalStrategy({},
  function(username, password, done) {
    User.findOne({ username: username, password: password }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      return done(null, user);
    });
  }
));
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


app.listen(process.env.PORT || 2400, () => {
  console.log("Server started: 2400")
})
//app.on('db connected', () => )
