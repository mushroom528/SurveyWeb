// models/Post.js

var mongoose = require('mongoose');
var Counter = require('./Counter');

// schema
var postSchema = mongoose.Schema({ 
  title:{type:String, required:[true, '제목을 입력해주세요!']},
  body:{type:String, required:[true, '내용을 입력해주세요!']},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},  // Schema.Types.ObjectId이거는 아이디 type, ref는 id가 속해있는 모델 (relation 형성)                   
  views:{type:Number, default:0}, // 조회수
  numId:{type:Number}, // 글번호
  createdAt:{type:Date, default:Date.now}, // Date.now는 현재 시간 리턴하는 함수
  updatedAt:{type:Date},
});

postSchema.pre('save', async function (next){ //
  var post = this;  // 글이 생성되면서 postSchema에 값 저장
  console.log("글: ",post)
  if(post.isNew){ // isNew -> 게시물이 생성되는 경우 true
    counter = await Counter.findOne({name:'posts'}).exec();
    console.log("카운터: ",counter);
    if(!counter) counter = await Counter.create({name:'posts'});
    counter.count++;
    counter.save();
    post.numId = counter.count;
  }
  return next();
});
// model & export
var Post = mongoose.model('post', postSchema);

module.exports = Post;