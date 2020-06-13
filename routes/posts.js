// routes/posts.js
var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var util = require('../util');

// Index 
router.get('/:boardNum', async function(req, res){
  var page = Math.max(1, parseInt(req.query.page));   // 게시판 페이지(쿼리스트링(문자열)-> 정수형, 최소 1)
  var limit = Math.max(1, parseInt(req.query.limit)); // 최대 페이지
  page = !isNaN(page)?page:1; // isNaN() 값이 NaN인지 판별(true, false)                         
  limit = !isNaN(limit)?limit:10; // 값이 없을 경우 기본값   

  // 무시할 게시물 변수(ex: 페이지당 5개의 게시물이 있으면, 3번째 페이지는 앞에 10개의 data는 무시하고 11번째부터)
  var skip = (page-1)*limit; 
  var count = await Post.countDocuments({}); // 조건에 맞는 데이터 수 저장 {} -> 조건 없음
  var maxPage = Math.ceil(count/limit); // 전체 페이지수

  var posts = await Post.find({boardNum:req.params.boardNum})                  // DB에서 데이터 찾기
  .populate('author')            // relation 된 항목의 값 생성 (user의 값을 author에 생성함)
  .sort('-createdAt')            // 정렬방법 -붙으면 내림차순 createdAt 수정될 경우 날짜 저장
  .skip(skip)   // 일정한 수 만큼 검색한 결과를 무시
  .limit(limit) // 일정한 수 만큼만 검색한 결과 보여줌
  .exec(function(err, posts){    // 데이터를 받아서 할일 쓰기
    if(err) return res.json(err);
    res.render('posts/index', {
      posts:posts, 
      boardNum: req.params.boardNum,
      currentPage:page, // 현재 페이지 번호
      maxPage:maxPage,  // 마지막 페이지 번호
      limit:limit       // 페이지당 보여줄 게시물 수
    });   // posts/index 로 렌더링 후 데이터 보내기
    //if (posts.length !== 0) console.log(posts, posts.length);
  });
});

// New
router.get('/:boardNum/new', util.isLoggedin, function(req, res){
  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('posts/new', { post:post, errors:errors, boardNum: req.params.boardNum });
});

// create
router.post('/:boardNum', util.isLoggedin, function(req, res){
  console.log("req.user:", req.user, req.params.boardNum);
  req.body.author = req.user._id; // req.user는 passport에 의해 로그인하면 자동 생성
  console.log("작성자:",req.body);
  Post.create(req.body, function(err, post){
    if(err){
        req.flash('post', req.body);
        req.flash('errors', util.parseError(err));
        return res.redirect('/posts/'+ req.params.boardNum +'new'+res.locals.getPostQueryString());
      }
    Post.findOneAndUpdate({title: req.body.title}, {boardNum: req.params.boardNum}, function(err, Num){
      if(err) return res.json(err);    
    });
    res.redirect('/posts/'+ req.params.boardNum + res.locals.getPostQueryString(false, {page:1}));
  });
});

// show
router.get('/:boardNum/:id', function(req, res){
  Post.findOne({_id:req.params.id})   // 하나만 검색 (findOne()) _id가 클릭한 게시물의 id인 데이터 출력
  .populate('author')             
  .exec(function(err, post){          
    if(err) return res.json(err);
    console.log('찾은데이터: ',post)
    res.render('posts/show', {post:post, boardNum: req.params.boardNum});
  });
});
// isLoggedin 함수를 사용하여 로그인 할 경우에만 해당 기능 사용 가능
// checkPermission 함수를 사용하여 본인이 작성한 글만 edit, update, delete가능
// edit
router.get('/:boardNum/:id/edit', util.isLoggedin, checkPermission, function(req, res){
    var post = req.flash('post')[0];
    var errors = req.flash('errors')[0] || {};
    if(!post){
      Post.findOne({_id:req.params.id}, function(err, post){
          if(err) return res.json(err);
          res.render('posts/edit', { post:post, errors:errors, boardNum: req.params.boardNum });
        });
    }
    else {
      post._id = req.params.id;
      res.render('posts/edit', { post:post, errors:errors, boardNum: req.params.boardNum });
    }
});

// update
router.put('/:boardNum/:id', util.isLoggedin, checkPermission, function(req, res){
    req.body.updatedAt = Date.now();
    Post.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
      if(err){
        req.flash('post', req.body);
        req.flash('errors', util.parseError(err));
        return res.redirect('/posts/'+req.params.boardNum+'/'+req.params.id+'/edit' + res.locals.getPostQueryString());
      }
      res.redirect('/posts/'+req.params.boardNum+'/'+req.params.id + res.locals.getPostQueryString());
    });
});

// destroy
router.delete('/:boardNum/:id', util.isLoggedin, checkPermission, function(req, res){
  Post.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/posts/'+ req.params.boardNum + res.locals.getPostQueryString());
  });
});

module.exports = router;

function checkPermission(req, res, next){   // 해당 게시물에 기록된 작성자와 로그인된 id를 비교하는 함수
  Post.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();   // 계속 진행
  });
}