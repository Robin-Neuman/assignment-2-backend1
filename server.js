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
require('dotenv').config()
var port = process.env.PORT || 3006;

var initializePass = require("./pass-config");

var users = [];

initializePass(
  passport,
  username =>
    users.find(user => user.username === username),

  id => 
    users.find(user => user.id === id)
)

var db = mysql.createConnection({
  host: process.env.HOSTNAME,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize())
app.use(passport.session({
  resave: true,
  saveUninitialized: true,
}))

app.post('/register', checkNotAuth, async (req, res) => {

  try {

    let pass = await bcrypt.hash(req.body.password, 10);
    db.query('SELECT * FROM users WHERE username=?', [req.body.username], function (err, rows, fields) {
      if (!!err || rows[0] != undefined) {
        console.log("Username already taken!")

        res.redirect('/register');
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
        res.redirect('/login');
      }
    })
  } catch{
    res.redirect('/');
  }
})

app.get('/', function (req, res) {
  res.redirect('/login');
})

app.get('/login', checkNotAuth, function (req, res) {
  res.render('login');
})

app.get('/register', checkNotAuth, function (req, res) {
  res.render('register');
})

app.get('/home', checkAuth, function (req, res) {
  db.query('SELECT * FROM restaurants', (err, rows, fields) => {
    res.render('home', {restaurants: rows})
  })
})

app.post('/login', checkNotAuth, passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/',
  failureFlash: true
}))

app.post('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

app.get('/restPage/:restPage', checkAuth, (req, res) => {
  db.query('SELECT * FROM restaurants WHERE name=?', [req.params.restPage], (err, rows, fields) => {
    if (rows[0] != undefined) {
    db.query('SELECT * FROM reviews WHERE restaurantId=?', [rows[0].id], function (err, reviews, fields){
    res.render('restPage', {name: req.params.restPage, reviews: reviews, username: req.user.username})
  })  
} else {
  res.redirect('/')
}
})
})

app.post('/addRestaurant', checkAuth, (req, res) => {
  db.query('INSERT INTO restaurants (name) VALUES (?)', [req.body.name], function (err, res) {
    if (!!err) {
      throw err;
    }
  })
  res.redirect('/home')
})

app.post('/addReview', checkAuth, (req, res) => {
  db.query('SELECT * FROM restaurants WHERE name=?', [req.body.restName], function (err, rest) {
    db.query('INSERT INTO reviews (body, restaurantId, username, rating) VALUES (?, ?, ?, ?)', [req.body.body, rest[0].id, req.body.username, req.body.rating], function (err, rev) {
      
    })
  })
  
  res.redirect(`/restPage/${req.body.restName}`)
})

app.post('/removeRev', checkAuth, (req, res) => {
  db.query('DELETE FROM reviews WHERE body=? AND username=? AND id=?', [req.body.body, req.body.username, req.body.id], function (err, rest) {
  })
  res.redirect(`/restPage/${req.body.restPage}`)
})


app.post('/removeRest', checkAuth, (req, res) => {
  db.query('DELETE FROM restaurants WHERE name=?', [req.body.name], function (err, rest) {
  })
  
  res.redirect(`/`)
})

app.post('/editRest', checkAuth, (req, res) => {
  db.query('UPDATE restaurants SET name=? WHERE name=?', [req.body.name, req.body.restPage], function (err, rest) {
  })
  
  res.redirect(`/restPage/${req.body.name}`)
})

function checkNotAuth (req, res, next) {
  if (req.isAuthenticated()) {
    
    return res.redirect('/home')
  }
  next()
}

function checkAuth (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login')
}



app.listen(port);

module.exports = app;
