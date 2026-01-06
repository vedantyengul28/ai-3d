const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userEmail: {
    type: String,
    required: false
  },
  topic: {
    type: String,
    required: true
  },
  currentChapter: {
    type: Number,
    default: 1
  },
  totalChapters: {
    type: Number,
    default: 0
  },
  chapters: [{
    chapterNumber: Number,
    content: String,
    title: String,
    sections: [{
      sectionTitle: String,
      content: String
    }]
  }],
  restartCount: {
    type: Number,
    default: 0
  },
  backCount: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0 // Percentage 0-100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

sessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Session', sessionSchema);




