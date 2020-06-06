// routes/home.js
var express = require('express');
var router = express.Router();

// Home
router.get('/', (req, res) => res.redirect('/home'));
router.get('/home', (req, res) => res.render('home/welcome'));
router.get('/about', (req, res) => res.render('home/about'));
//router.get('/new', (req, res) => res.render('users/new'));
//router.post('/home', (req, res) => res.send("gOoD"));
module.exports = router;