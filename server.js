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
var bcrypt = require('bcryptjs');
var port = process.env.PORT || 3000;

var initializePass = require("./pass-config");

var users = [];

initializePass(
  passport,
  username =>
    users.find(user => user.username === username),

  id => 
    users.find(user => user.id === id)
)


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// var db = mysql.createConnection({
//   host: 'eu-cdbr-west-02.cleardb.net',
//   user: 'b2ef15df6cafb2',
//   password: '99921bac',
//   database: 'heroku_5bcb73518029905'
// });

var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'bbkkll123',
  database: 'assignment'
});

function handleConnection() {
  db.connect(function connectDB(err) {
    if (err) {
      throw err;
    }
    console.log('Mysql connected');
  })
}

handleConnection()

db.on('error', function errorDB(err) {
  if (err.code == 'PROTOCOL_CONNECTION_LOST') {
    handleConnection();
  } else {
    throw err;
  }
})

db.query('SELECT * FROM users', (err, rows, fields) => {
  for (const user of rows) {
    users.push({ "username": user.username, "id": user.id, "password": user.password });
  }
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

app.get('/', checkNotAuth, (req, res) => {
  res.redirect('/index');
})

app.get('/index', checkNotAuth, (req, res) => {
  res.render('index');
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize())
app.use(passport.session({
  resave: true,
  saveUninitialized: true,
}))
app.use(flash())
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.post('/register', async (req, res) => {

  try {

    let pass = await bcrypt.hash(req.body.password, 10);
    db.query('SELECT * FROM users WHERE username=?', [req.body.username], function (err, rows, fields) {
      if (!!err || rows[0] != undefined) {
        console.log("Username already taken!")
        console.log("HERE", rows[0].username)

        res.redirect('/');
      } else {
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [req.body.username, pass], function (err, res) {
          if (!!err) {
            throw err;
          } else {
            
            console.log("New user inserted into db!");
            db.query('SELECT * FROM users', (err, rows, fields) => {
              for (const user of rows) {
                if (user.username != rows.username) {
                  users.push({ "username": user.username, "id": user.id, "password": user.password });
                }
              }  
            })
            
          }
          
        })
        res.redirect('/home');
      }
    })
  } catch{
    res.redirect('/');
  }
})

app.get('/home', checkAuth, function (req, res) {
  res.render('home')

})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/',
  failureFlash: true
}))

function checkAuth (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/')
}

function checkNotAuth (req, res, next) {
  if (req.isAuthenticated()) {
    console.log("Code runs")
    return res.redirect('/home')
  }
  next()
}

app.listen(port);

module.exports = app;
