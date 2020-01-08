var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var path = require('path');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var port = process.env.PORT || 3000;
var session = require('express-session');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'bbkkll123',
  database: 'assignment'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Mysql connected');
})

var app = express();

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index');
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize())
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.post('/login', function (req, res) {
  db.query('SELECT * FROM users WHERE username=? AND password=?', [req.body.username, req.body.password], function (err, rows, fields) {
    if (!!err || rows.length < 1) {
      console.log("Error in the query");
      res.redirect('/');
    } else {
      req.session.loggedin = true;
      req.session.username = req.body.username;
      res.redirect('/home');
    }
  })
})

app.post('/register', function (req, res) {
  if(req.body.usernameReg && req.body.passwordReg){
  db.query('SELECT * FROM users WHERE username=? AND password=?', [req.body.usernameReg, req.body.passwordReg], function (err, rows, fields) {
    if (!!err || rows > 0) {
      console.log("Username already taken");
      res.redirect('/');
    } else {
      db.query('INSERT INTO users (username, password) VALUES (?, ?)', [req.body.usernameReg, req.body.passwordReg], function(err, res) {
        if(!!err){
          throw err;
        } else{
          console.log("New user inserted into db!");
        }
      })
      req.session.loggedin = true;
      req.session.username = req.body.username;
      res.redirect('/home');
    }
  })
}
})

app.get('/home', function (req, res) {
  if (req.session.loggedin) {
    res.cookie('user', req.session.username, { maxAge: 3600, httpOnly: false });
    res.render('home');
  } else {
    res.send('Please login to view this page!');
  }
  res.end();

})

app.listen(port);

module.exports = app;
