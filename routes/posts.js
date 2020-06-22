// routes/posts.js
var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var util = require('../util');
var Comment = require('../models/Comment');

// Index 
var ClevisURL = {
  // URL Pattern
  _patterns : {
    url : '(?:\\b(?:(?:(?:(ftp|https?|mailto|telnet):\\/\\/)?(?:((?:[\\w$\\-'
      + '_\\.\\+\\!\\*\\\'\\(\\),;\\?&=]|%[0-9a-f][0-9a-f])+(?:\\:(?:[\\w$'
      + '\\-_\\.\\+\\!\\*\\\'\\(\\),;\\?&=]|%[0-9a-f][0-9a-f])+)?)\\@)?((?'
      + ':[\\d]{1,3}\\.){3}[\\d]{1,3}|(?:[a-z0-9]+\\.|[a-z0-9][a-z0-9\\-]+'
      + '[a-z0-9]\\.)+(?:biz|com|info|name|net|org|pro|aero|asia|cat|coop|'
      + 'edu|gov|int|jobs|mil|mobi|museum|tel|travel|ero|gov|post|geo|cym|'
      + 'arpa|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|'
      + 'bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bw|by|bz|ca|cc|cd|cf|cg|ch'
      + '|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|e'
      + 'r|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|'
      + 'gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it'
      + '|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|l'
      + 't|lu|lv|ly|ma|mc|me|md|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|'
      + 'mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph'
      + '|pk|pl|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|s'
      + 'i|sk|sl|sm|sn|sr|st|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tr|'
      + 'tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|za|zm'
      + '|zw)|localhost)\\b(?:\\:([\\d]+))?)|(?:(file):\\/\\/\\/?)?([a-z]:'
      + '))(?:\\/((?:(?:[\\w$\\-\\.\\+\\!\\*\\(\\),;:@=ㄱ-ㅎㅏ-ㅣ가-힣]|%['
      + '0-9a-f][0-9a-f]|&(?:nbsp|lt|gt|amp|cent|pound|yen|euro|sect|copy|'
      + 'reg);)*\\/)*)([^\\s\\/\\?:\\"\\\'<>\\|#]*)(?:[\\?:;]((?:\\b[\\w]+'
      + '(?:=(?:[\\w\\$\\-\\.\\+\\!\\*\\(\\),;:=ㄱ-ㅎㅏ-ㅣ가-힣]|%[0-9a-f]'
      + '[0-9a-f]|&(?:nbsp|lt|gt|amp|cent|pound|yen|euro|sect|copy|reg);)*'
      + ')?\\&?)*))*(#[\\w\\-ㄱ-ㅎㅏ-ㅣ가-힣]+)?)?)',
    querystring: new RegExp('(\\b[\\w]+(?:=(?:[\\w\\$\\-\\.\\+\\!\\*\\(\\),;'
      + ':=ㄱ-ㅎㅏ-ㅣ가-힣]|%[0-9a-f][0-9a-f]|&(?:nbsp|lt|gt|amp|cent|poun'
      + 'd|yen|euro|sect|copy|reg);)*)?)\\&?', 'gi')
  },

  /**
   * _process : 정규식 컴파일 후 검색
   * @param	(string)		string			문자열
   * @param	(string)		modifiers		정규식 수식어
   * @return	(mixed)							정규식 결과 = [ array | null ]
   */
  _process : function (string, modifiers)
  {
    if ( ! string) throw new Error(1, '입력값이 비어 있습니다.');

    var p = new RegExp(ClevisURL._patterns.url, modifiers);
    return string.match(p);
  },

  /**
   * collect : 문장에서 여러 URL 주소 검색
   * @param	(string)		text			URL 을 찾을 문장
   * @return	(array)							배열로 리턴
   */
  collect : function (text)
  {
    var r = ClevisURL._process(text, 'gmi');
    return (r) ? r : [];
  },

  /**
   * parse : 하나의 URL 주소를 분석
   * @param	(string)		url				URL 주소
   * @return	(object)						객체로 리턴
   */
  parse : function (url, type)
  {
    var r = ClevisURL._process(url, 'mi');

    if ( ! r) return {};

    // HTTP 인증정보
    if (r[2]) r[2] = r[2].split(':');

    // 쿼리스트링 분석
    if (r[9]) {
      r[9] = r[9].match(ClevisURL._patterns.querystring);
      for (var n = 0; n < r[9].length; n++) {
        r[9][n] = (r[9][n] ? r[9][n].replace(/\&$/, '').split('=') : []);
        if (r[9][n].length == 1)
          r[9][n][1] = '';
      }
    }

    // 프로토콜이 없을 경우 추가
    if ( ! r[1] && ! r[5]) {
      // 도메인이 없는 경우 로컬 파일 주소로 설정
      if ( ! r[3]) r[5] = 'file';

      // E-Mail 인지 체크
      else if (r[0].match(new RegExp('^('+ r[2][0] +'@'+ r[3] +')$')))
        r[1] = 'mailto';

      // 기타 기본 포트를 기준으로 프로토콜 설정.
      // 포트가 없을 경우 기본적으로 http 로 설정
      else {
        switch (r[4]) {
          case 21:	r[1] = 'ftp'; break;
          case 23:	r[1] = 'telnet'; break;
          case 443:	r[1] = 'https'; break;
          case 80:
          default:	r[1] = 'http'; break;
        }
      }

      r[0] = (r[1] ? r[1] +'://' : r[5] +':///')
        + r[0];
    }

    return {
      'url'		: r[0],						// 전체 URL
      'protocol'	: (r[1] ? r[1] : r[5]),		// [ftp|http|https|mailto|telnet] | [file]
      'userid'	: (r[2] ? r[2][0] : ''),	// 아이디 : HTTP 인증 정보
      'userpass'	: (r[2] ? r[2][1] : ''),	// 비밀번호
      'domain'	: (r[3] ? r[3] : ''),		// 도메인주소
      'port'		: (r[4] ? r[4] : ''),		// 포트
      'drive'		: (r[6] ? r[6] : ''),		// 'file' 프로토콜인 경우
      'directory'	: (r[7] ? r[7] : ''),		// 하위 디렉토리
      'filename'	: (r[8] ? r[8] : ''),		// 파일명
      'querys'	: (r[9] ? r[9] : ''),		// 쿼리스트링
      'anchor'	: (r[10] ? r[10] : '')		// Anchor
    };
  }
};

//

router.get('/:boardNum', async function(req, res){
  var page = Math.max(1, parseInt(req.query.page));   // 게시판 페이지(쿼리스트링(문자열)-> 정수형, 최소 1)
  var limit = Math.max(1, parseInt(req.query.limit)); // 최대 페이지
  //var manage = req.user.manage;
  page = !isNaN(page)?page:1; // isNaN() 값이 NaN인지 판별(true, false)                         
  limit = !isNaN(limit)?limit:10; // 값이 없을 경우 기본값   
  var searchQuery = createSearchQuery(req.query);
  console.log("search: ", req.query);
  // 무시할 게시물 변수(ex: 페이지당 5개의 게시물이 있으면, 3번째 페이지는 앞에 10개의 data는 무시하고 11번째부터)
  var skip = (page-1)*limit; 
  var count = await Post.countDocuments({$and: [{boardNum: req.params.boardNum}, searchQuery]}); // 조건에 맞는 데이터 수 저장 {} -> 조건 없음
  var maxPage = Math.ceil(count/limit); // 전체 페이지수
  if(req.user){
    var manager = req.user.manager;
    var state=req.user.state;
  }
  else{
    var manager=0;
    var state=0;
  }
  var posts = await Post.find({$and: [{boardNum: req.params.boardNum}, searchQuery]}) // DB에서 데이터 찾기
  .populate('author')            // relation 된 항목의 값 생성 (user의 값을 author에 생성함)
  .sort('-createdAt')            // 정렬방법 -붙으면 내림차순 createdAt 수정될 경우 날짜 저장
  .skip(skip)   // 일정한 수 만큼 한 결과를 무시
  .limit(limit) // 일정한 수 만큼만 검색한 결과 보여줌
  .exec(function(err, posts){    // 데이터를 받아서 할일 쓰기
    if(err) return res.json(err);
    //console.log("검색한 게시물:",posts);
    res.render('posts/index', {
      posts:posts, 
      boardNum: req.params.boardNum,
      currentPage:page, // 현재 페이지 번호
      maxPage:maxPage,  // 마지막 페이지 번호
      limit:limit,       // 페이지당 보여줄 게시물 수
      searchType:req.query.searchType, 
      searchText:req.query.searchText, 
      manager:manager,
      state:state,
    });  
     // posts/index 로 렌더링 후 데이터 보내기
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
        return res.redirect('/posts/'+ req.params.boardNum +'/'+'new'+res.locals.getPostQueryString());
      }
    Post.findOneAndUpdate({title: req.body.title}, {boardNum: req.params.boardNum}, function(err, Num){
      if(err) return res.json(err);    
    });
    Post.findOne({$and: [{title: req.body.title}, {body: req.body.body}]})
    .exec((err, post) => {
      // 새 글 작성시 쿼리스트링 제거하여 전체 게시물 보이게 함
      res.redirect('/posts/'+ req.params.boardNum +"/"+post._id+ res.locals.getPostQueryString(false, { page:1, searchText:'' }));
    });
    
  });
});

// show
router.get('/:boardNum/:id', function(req, res){
  var commentForm = req.flash('commentForm')[0] || {_id: null, form: {}};
  var commentError = req.flash('commentError')[0] || { _id:null, parentComment: null, errors:{}};
  var a=0;
    Promise.all([ // DB에서 두개 이상의 데이터를 받을때 사용하는 함수, 배열을 인자로 받음
      Post.findOne({_id:req.params.id}).populate({ path: 'author', select: 'stdid' }),
      Comment.find({post:req.params.id}).sort('createdAt').populate({ path: 'author', select: 'stdid' })
    ])
    .then(([post, comments]) => {
      var urll= ClevisURL.collect(post.body);
      console.log("추출된 url",urll[0]);
      console.log("변경전",post.body);

     // post.body = post.body.replace(/<(\/img|img)([^>]*)>/gi,"");
    var text = post.body.replace(urll[0],"");
    if (post.body.indexOf("<p>"+urll[0]+"</p>") != -1){
      a=1;
    }
    else if(post.body.indexOf("<a href="+'"'+urll[0])!=-1){
      a=0;
    }
      
        
      
      console.log("변경후",text);
      console.log("하하",a);
      res.render('posts/show', { text:text,post:post, comments:comments, commentForm:commentForm, commentError:commentError, boardNum: req.params.boardNum, urll:urll[0],a:a});
      
    })
    .catch((err) => {
      console.log('err: ', err);
      return res.json(err);
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

function createSearchQuery(queries){ // 4
  var searchQuery = {};
  //  searchType, searchText가 존재하고 Text의 길이가 3이상일 경우에만 수행, 그 이외는 {}로 하여 전체 게시물 검색
  if(queries.searchType && queries.searchText && queries.searchText.length >= 3){
    var searchTypes = queries.searchType.toLowerCase().split(',');  // 서치타입을 받아 배열로 만들기
    console.log("서치타입:", searchTypes);
    var postQueries = [];
    if(searchTypes.indexOf('title')>=0){
      postQueries.push({ title: { $regex: new RegExp(queries.searchText, 'i') } });
    }
    if(searchTypes.indexOf('body')>=0){
      postQueries.push({ body: { $regex: new RegExp(queries.searchText, 'i') } });
    }
    if(postQueries.length > 0) searchQuery = {$or:postQueries};
  }
  console.log("서치쿼리:",searchQuery);
  return searchQuery;
}