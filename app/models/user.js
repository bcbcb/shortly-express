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
    // if (!username || !password) throw new Error('Username and password are both required');
    // console.log(username, password, '!');
    // this.on('creating', function (model, attrs, options) {
    //   bcrypt.genSalt(10, function(err, salt) {
    //     bcrypt.hash(password, salt, null, function(err, hash) {
    //       model.set('hashed_password', hash);
    //       console.log( model.get('username'), model.get('hashed_password') );
    //     });
      // });

    // });
  }

}, {

  hashPassword: function (password, cb) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, null, function(err, hash) {
          cb(hash);
        });
      });
  },

  login: function (username, password) {
    //check if client provided both username & password
    if (!username || !password) throw new Error('Username and password are both required');
    // check if username exists in database
    return new this({username: username.trim()})
      .fetch({require: true})
      .tap( function (customer) {
        return bcrypt.compareAsync(customer.get('password'), password);


      // if exists, concat SALT & hash password
      // if hash matches database, they they are logged in
      // redirect to wherever they go
      });
  }
});

module.exports = User;
