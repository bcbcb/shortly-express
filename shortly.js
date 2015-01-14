var express = require('express');
var partials = require('express-partials');
var session = require('express-session');
var bodyParser = require('body-parser');


var util = require('./lib/utility');
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

var checkUser = function (req, res, next) {
  if (req.session && req.session.token) {
    next();
  } else {
    res.redirect('/login');
  }
};


app.get('/', checkUser, function(req, res) {
  res.render('index');
});

app.get('/create', checkUser, function(req, res) {
  res.render('index');
});

app.get('/links', checkUser, function(req, res) {
  Links.reset()
    .query('where', 'user_id', '=', req.session.user)
    .fetch()
    .then(function (links) {
      res.send(200, links.models);
    });
});

app.post('/links', checkUser, function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    return res.send(404, 'Not a valid URL: ' + uri);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin,
          user_id: req.session.user
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});


/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  new User({ username: username }).fetch()
    .then(function (found) {
      if (found) {
        res.send(200, 'Username taken, choose another username');
      } else {
        User.hashPassword( password, function (hash) {
          var user = new User( {username: username, password: hash} );
          user.save()
            .then(function (newUser) {
            Users.add(newUser);
            res.redirect('/');
          });
        });
      }
    });
});

app.post('/login', function (req, res) {
  User.login(req, res);
});

app.post('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/');
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function (req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
