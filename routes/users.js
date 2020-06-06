// routes/users.js
var express = require('express');
var router = express.Router();
var User = require('../models/User');

//new
router.get('/new', (req, res) => {
  var user = req.flash('user')[0] || {};  // 유저 이름과 에러메세지 받아오기
  var errors = req.flash('errors')[0] || {};
  res.render('users/new', { user:user, errors:errors });
});

// create
router.post('/', (req, res) => {
  console.log(req.body);
  User.create(req.body, (err, user) => {
    if(err) {
      req.flash('user', req.body);  // 생성시 에러가 있으면 에러메세지 생성 후 redirect
      req.flash('errors', parseError(err));
      return res.redirect('/users/new');
    } 
    res.redirect('/home');
  });
});

module.exports = router;

// 각종 에러들을 객체형태로 만듬
function parseError(errors){
  var parsed = {};
  console.log("errors: ", errors);
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  }
  else if(errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
    parsed.username = { message:'This username already exists!' };
  }
  else {
    parsed.unhandled = JSON.stringify(errors);
  }
  return parsed;
}