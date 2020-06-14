// models/Comment.js

var mongoose = require('mongoose');

// schema
var commentSchema = mongoose.Schema({
  post:{type:mongoose.Schema.Types.ObjectId, ref:'post', required:true},   // 게시글과 관계 형성
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true}, // 유저와 관계 형성
  parentComment:{type:mongoose.Schema.Types.ObjectId, ref:'comment'}, // 대댓글 기능 할때 필요(댓글과 대댓글간의 관계)
  text:{type:String, required:[true,'글을 작성해주세요']},
  isDeleted:{type:Boolean}, // 3
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
},{
  toObject:{virtuals:true}
});

commentSchema.virtual('childComments') // 대댓글은 가상의 데이터로 추가
  .get(function(){ return this._childComments; })
  .set(function(value){ this._childComments=value; });

// model & export
var Comment = mongoose.model('comment',commentSchema);
module.exports = Comment;