// routes/posts.js
var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var util = require('../util');

// Index 
router.get('/', function(req, res){
  Post.find({})                  // DB에서 데이터 찾기
  .sort('-createdAt')            // 정렬방법 -붙으면 내림차순 createdAt 수정될 경우 날짜 저장
  .exec(function(err, posts){    // 데이터를 받아서 할일 쓰기
    if(err) return res.json(err);
    res.render('posts/index', {posts:posts});   // posts/index 로 렌더링 후 데이터 보내기
    if (posts.length !== 0) console.log(posts, posts.length);
  });
});

// New
router.get('/new', function(req, res){
  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('posts/new', { post:post, errors:errors });
});

// create
router.post('/', function(req, res){
  Post.create(req.body, function(err, post){
    if(err){
        req.flash('post', req.body);
        req.flash('errors', util.parseError(err));
        return res.redirect('/posts/new');
      }
    res.redirect('/posts');
  });
});

// show
router.get('/:id', function(req, res){
  Post.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    res.render('posts/show', {post:post});
  });
});

// edit
router.get('/:id/edit', function(req, res){
    var post = req.flash('post')[0];
    var errors = req.flash('errors')[0] || {};
    if(!post){
      Post.findOne({_id:req.params.id}, function(err, post){
          if(err) return res.json(err);
          res.render('posts/edit', { post:post, errors:errors });
        });
    }
    else {
      post._id = req.params.id;
      res.render('posts/edit', { post:post, errors:errors });
    }
});

// update
router.put('/:id', function(req, res){
    req.body.updatedAt = Date.now();
    Post.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
      if(err){
        req.flash('post', req.body);
        req.flash('errors', util.parseError(err));
        return res.redirect('/posts/'+req.params.id+'/edit');
      }
      res.redirect('/posts/'+req.params.id);
    });
});

// destroy
router.delete('/:id', function(req, res){
  Post.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/posts');
  });
});

module.exports = router;