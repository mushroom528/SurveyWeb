// routes/comment.js

var express  = require('express');
var router = express.Router();
var Comment = require('../models/Comment');
var Post = require('../models/Post');
var util = require('../util');

// create
router.post('/:boardNum', util.isLoggedin, checkPostId, function(req, res){ // checkPostId는 미들웨어 함수 전달받은 id가 db에 있는지 확인
  var post = res.locals.post; 

  req.body.author = req.user._id; 
  req.body.post = post._id;       

  Comment.create(req.body, function(err, comment){
    if(err){
      req.flash('commentForm', { _id: null, form:req.body });                 // id항목과 form데이터를 저장
      req.flash('commentError', { _id: null, errors:util.parseError(err) });  // 에러내용 저장
    }
    return res.redirect('/posts/'+req.params.boardNum+'/'+post._id+res.locals.getPostQueryString()); //4
  });
});

// update 
router.put('/:id/:boardNum', util.isLoggedin, checkPermission, checkPostId, function(req, res){
  var post = res.locals.post;

  req.body.updatedAt = Date.now();
  Comment.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, comment){
    if(err){
      req.flash('commentForm', { _id: req.params.id, form:req.body });
      req.flash('commentError', { _id: req.params.id, errors:util.parseError(err) });
    }
    return res.redirect('/posts/'+req.params.boardNum+'/'+post._id+res.locals.getPostQueryString());
  });
});

// destroy
router.delete('/:id/:boardNum', util.isLoggedin, checkPermission, checkPostId, function(req, res){
  var post = res.locals.post;

  Comment.findOne({_id:req.params.id}, function(err, comment){
    if(err) return res.json(err);

    // save updated comment
    comment.isDeleted = true;
    comment.save(function(err, comment){
      if(err) return res.json(err);

      return res.redirect('/posts/'+req.params.boardNum+'/'+post._id+res.locals.getPostQueryString());
    });
  });
});
module.exports = router;

// private functions
function checkPostId(req, res, next){ // checkPostId는 미들웨어 함수 전달받은 id가 db에 있는지 확인
  Post.findOne({_id:req.query.postId},function(err, post){
    if(err) return res.json(err);

    res.locals.post = post; // 검색한 것을 res.locals.post에 보관
    next();
  });
}

function checkPermission(req, res, next){ // 작성자인지 아닌지 확인
  Comment.findOne({_id:req.params.id}, function(err, comment){
    if(err) return res.json(err);
    if(comment.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
