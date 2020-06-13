// routes/users.js
var express = require('express');
var router = express.Router();
var User = require('../models/User');
var util = require('../util');
var multer = require('multer');
var storage = multer.diskStorage({
  destination : function(req, file, cb){    

    cb(null, 'uploads/');
  },

  //실제 저장되는 파일명 설정
  filename : function(req, file, cb){
    //파일명 설정을 돕기 위해 요청정보(req)와 파일(file)에 대한 정보를 전달함
    var ss = req.body.stdid;
    //Multer는 어떠한 파일 확장자도 추가하지 않습니다. 
    //사용자 함수는 파일 확장자를 온전히 포함한 파일명을 반환해야 합니다.        
    var mimeType;

    switch (file.mimetype) {
      case "image/jpeg":
        mimeType = "jpg";
      break;
      case "image/png":
        mimeType = "png";
      break;
      case "image/gif":
        mimeType = "gif";
      break;
      case "image/bmp":
        mimeType = "bmp";
      break;
      default:
        mimeType = "jpg";
      break;
    }

    cb(null, ss + "." + mimeType);
  }
});
var upload = multer({storage: storage});

router.get('/new', (req, res) => {
  var user = req.flash('user')[0] || {};  // 유저 이름과 에러메세지 받아오기
  var errors = req.flash('errors')[0] || {};
  console.log("에러: ",errors);
  res.render('users/new', { user:user, errors:errors });
});

// create
router.post('/', upload.single('user_file'),(req, res) => {
  User.create(req.body, (err, user) => {
    if(err) {
      req.flash('user', req.body);  // 생성시 에러가 있으면 에러메세지 생성 후 redirect
      req.flash('errors', util.parseError(err));
      return res.redirect('/users/new');
    }
    console.log(req.file);
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