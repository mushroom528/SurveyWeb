// models/User.js
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');

// schema // 1
var userSchema = mongoose.Schema({
  stdid:{
    type:String, 
    required:[true,'Username is required!'], 
    match:[/^.{8,8}$/,'학번을 올바르게 입력해주세요.'], // regex(정규표현식) 자세한건 검색
    trim:true, // 문자열 앞, 뒤 공백삭제
    unique:true
  },
  password:{
    type:String, 
    required:[true,'비밀번호를 입력해주세요.'], 
    trim:true,
    select:false
  },
  state:{
    type:Number, 
    default: 0} // 사진인증 X -> 0, 사진인증 O -> 1
},{
  toObject:{virtuals:true}
});

// 비밀번호 확인하는건 DB에 저장안하고 가상의 데이터로 남김
userSchema.virtual('passwordConfirmation')
  .get(function(){ return this._passwordConfirmation; })
  .set(function(value){ this._passwordConfirmation=value; });


  // hash password 
userSchema.pre('save', function (next){ // pre(이벤트 발생하기 전), save(data create시)
  var user = this;
  if(!user.isModified('password')){ 
    return next();
  }
  else {
    user.password = bcrypt.hashSync(user.password); // hashSync() 함수로 비밀번호를 해쉬함수로 변환
    return next();
  }
});

// DB에 저장되어있는 비밀번호와 입력한 비밀번호를 비교하는 함수
userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};

// password validation 
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,16}$/; // 문자와 숫자 섞어서 6~16자로 하세요
var passwordRegexErrorMessage = '문자와 숫자를 섞어 6~16자로 해주세요.'; // 에러메세지
userSchema.path('password').validate(function(v) {
  var user = this; 

  // 비밀번호와 비밀번호 확인이 다를경우
  if(user.isNew){ // isNew는 해당 모델이 생성되면 true
    if(user.password !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', '비밀번호와 비밀번호 확인이 달라요.');
    if(!passwordRegex.test(user.password)){ // 정규표현식 테스트 true, false 반환
      user.invalidate('password', passwordRegexErrorMessage); // false면 에레메세지
      } 
    }
  }
});

// model & export
var User = mongoose.model('user',userSchema);
module.exports = User;