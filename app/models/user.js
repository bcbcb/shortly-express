var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var db = require('../config');
var Link = require('./link');

var User = db.Model.extend(
  {
    tableName: 'users',
    hasTimestamps: true,
    links: function () {
      return this.hasMany(Link);
    },
  },

  {
    hashPassword: function (password, cb) {
      bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(password, salt, null, function(err, hash) {
            cb(hash);
          });
        });
    },

    login: function (req, res) {
      var username = req.body.username;
      var password = req.body.password;

      //check if client provided both username & password
      if (!username || !password) {
        throw new Error('Username and password are both required');
      }

      // check if username exists in database
      return new this( { username: username.trim() } )
        .fetch( { require: true } )
        .tap( function (user) {
          return bcrypt.compare(password, user.get('password'), function(err, found) {
            if (found) {
              // make and set a new token
              var token = crypto.createHash('sha1')
                .update(user.get('username'))
                .digest('hex');
              user.set('token', token);

              req.session.token = token;
              req.session.user = user.get('id');

              // redirect to home after login
              res.set('Location', '/');
              res.redirect('/');

            } else {
              res.send(200, 'Login failed.');
            }
          });
        });
    }
  }
);

module.exports = User;
