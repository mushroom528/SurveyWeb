// routes/home.js
var express = require('express');
var router = express.Router();
var passport = require('../config/passport');

// Home
router.get('/login', (req, res) => {
    var username = req.flash('stdid')[0];   // passport.js 에서 온 데이터들
    var errors = req.flash('errors')[0] || {};
    res.render('home/login', {
      username:username,
      errors:errors
    });
});
router.get('/home', (req, res) => {
    var succId = req.flash('succId')[0] || {};
    var admin = req.flash('admin')[0] || {};
    
    res.render('home/welcome', { succId : succId, admin : admin })
    
  })
router.get('/', (req, res) => res.redirect('/home'));
//router.get('/home', (req, res) => res.render('home/welcome'));
router.get('/about', (req, res) => res.render('home/about'));
router.post('/login',(req,res,next) => {
    var errors = {};
    var isValid = true;
    console.log(req.body,"로그인시도");
    if(!req.body.stdid){
        //console.log("아디안씀");
        isValid = false;
        errors.stdid = '학번을 입력해주세요.';
    }
    if(!req.body.password){
      isValid = false;
      errors.password = '비밀번호를 입력해주세요.';
    }
    if(isValid){
      next();
    }
    else {
      req.flash('errors',errors);
      res.redirect('/login');
    }
    //req.flash('succId',req.body);
  },
  passport.authenticate('local-login', {    // 로그인 성공, 실패시 해당 경로로 redirect
    successRedirect : '/home',
    failureRedirect : '/login'
  }
));

router.get('/logout', (req, res) => {
  req.logout(); // passport에서 제공되는 로그아웃 함수 사용
  res.redirect('/');
});

module.exports = router;