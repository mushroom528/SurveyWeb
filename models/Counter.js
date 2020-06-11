// models/Counter.js

var mongoose = require('mongoose');

// schema 글번호 관련 스키마
var counterSchema = mongoose.Schema({
  name:{type:String, required:true},
  count:{type:Number, default:0},
});

// model & export
var Counter = mongoose.model('counter', counterSchema);
module.exports = Counter;