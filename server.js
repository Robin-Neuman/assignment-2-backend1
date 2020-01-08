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


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'bbkkll123',
  database: 'assignment'
});

db.connect((err) => {
  if(err){
    throw err;
  }
  console.log('Mysql connected');
})

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
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

app.post('/login', function(req, res) {
  console.log(req.body.username);
  db.query('SELECT * FROM users WHERE username=?', [req.body.username], function(err, rows, fields) {
    if(!!err || rows.length <= 0) {
      console.log("Error in the query");
      res.redirect('/');
    } else {
      console.log("Successful query");
      console.log(rows);
      res.redirect('/home');
    }
  })
})

app.get('/home', function(req, res) {
  res.render('home');
})

app.listen(port);

module.exports = app;
