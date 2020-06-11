// routes/users.js
var express = require('express');
var router = express.Router();
var User = require('../models/User');
var util = require('../util');

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
      req.flash('errors', util.parseError(err));
      return res.redirect('/users/new');
    } 
    res.redirect('/home');
  });
});

module.exports = router;
// 권한 확인 함수
function checkPermission(req, res, next){
  User.findOne({username:req.params.username}, function(err, user){
   if(err) return res.json(err);
   if(user.id != req.user.id) return util.noPermission(req, res);
 
   next();
  });
 }