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

module.exports = util;