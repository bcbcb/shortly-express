var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  links: function(){
    return this.hasMany(Link);
  },

  initialize: function() {
    console.log('initialize');
  }

}, {

  hashPassword: function (password, cb) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, null, function(err, hash) {
          cb(hash);
        });
      });
  },

  login: function (req, res, cb) {
    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    //check if client provided both username & password
    if (!username || !password) throw new Error('Username and password are both required');
    // check if username exists in database
    return new this({username: username.trim()})
      .fetch({require: true})
      .tap( function (user) {
        return bcrypt.compare(password, user.get('password'), function(err, result) {
          if(result) {
            console.log('successful login');
            // console.log (res);
            // create a session
            // req.session.cookie = {maxAge: 3600000};
            req.session.token = 'token';
            console.log(req.session);
            res.setHeaders('Location', '/');
            res.redirect('/');
          }else {
            res.send(200, 'login failed');
          }
        });

        // compare(data, encrypted, cb)


      // if exists, concat SALT & hash password
      // if hash matches database, they they are logged in
      // redirect to wherever they go
      });
  }
});

module.exports = User;
