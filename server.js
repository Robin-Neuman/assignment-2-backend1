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
var flash = require('express-flash');
var session = require('express-session');
var port = process.env.PORT || 3000;

var initializePass = require("./pass-config");

initializePass(
  passport, 
  username => {
    db.query('SELECT * FROM users WHERE username=?', [username], function (err, rows, fields) {
    return rows.username;

  }),

  id => 
    db.query('SELECT * FROM users WHERE id=?', [username.id], function (err, rows, fields) {
    return rows.id;

  })
  })


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
  resave: false,
  saveUninitialized: false
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
app.use(passport.session())
app.use(flash())
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/',
  failureFlash: true
})
)

app.post('/register', function (req, res) {
  try{
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
      res.redirect('/home');
    }
  })
} catch{
  res.redirect('/login');
}
})

app.get('/home', function (req, res) {
    res.render('home')

})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/index',
  failureFlash: true
}))

app.listen(port);

module.exports = app;