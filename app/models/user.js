var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  links: function(){
    return this.hasMany(Link);
  }

}, {

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
  },

  create: function(username, password) {
    if (!username || !password) throw new Error('Username and password are both required');
    this.on('creating', function (model, attrs, options) {
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
          model.set('hashed_password', hash);
          console.log( model.get('username'), model.get('hashed_password') );
        });
      });

    });
  }


});

module.exports = User;
