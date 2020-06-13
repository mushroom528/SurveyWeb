// 각종 에러들을 객체로 만드는 함수

var util = {};

util.parseError = function(errors){
  var parsed = {};
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

util.isLoggedin = function(req, res, next){   // route에서 콜백될 함수, login인지 아닌지 판단
  if(req.isAuthenticated()){
    next();
  } 
  else {
    req.flash('errors', {login:'로그인 해주세요.'});
    res.redirect('/login');
  }
}

util.noPermission = function(req, res){   // 콜백함수 아님, 권한을 확인하는 함수
  req.flash('errors', {login:"권한이 없습니다."});
  req.logout();
  res.redirect('/login');
}

// res.query에서 전달받은 query에서 page, limit값을 추출하여 다시 한줄의 문자열로 만듬
util.getPostQueryString = function(req, res, next){ // res.local에 getPostQueryString()를 추가(express의 미들웨어)
  res.locals.getPostQueryString = function(isAppended=false, overwrites={}){  // 함수에 아무런 인자를 전달하지 않을 경우 초기값, false, {}    
    var queryString = '';
    var queryArray = [];
    var page = overwrites.page?overwrites.page:(req.query.page?req.query.page:'');
    var limit = overwrites.limit?overwrites.limit:(req.query.limit?req.query.limit:'');

    if(page) queryArray.push('page='+page);
    if(limit) queryArray.push('limit='+limit);

    if(queryArray.length>0) queryString = (isAppended?'&':'?') + queryArray.join('&');

    return queryString;
  }
  next();
}

module.exports = util;