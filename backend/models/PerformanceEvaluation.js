// models/PerformanceEvaluation.js
const mongoose = require('mongoose');

const PerformanceEvaluationSchema = new mongoose.Schema({
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  metrics: {
    incomeTotal: { type: Number, default: 0 },
    attendance: {
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      halfDay: { type: Number, default: 0 },
      remote: { type: Number, default: 0 }
    }
  },
  evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  // Per-employee ratings attached to this evaluation
  ratings: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    ratingType: { type: String, enum: ['stars', 'percentage'], default: 'stars' },
    ratingValue: { type: Number, required: true },
    ratedAt: { type: Date, default: Date.now },
    evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true }
  }],
  notes: { type: String }
}, { timestamps: true });

PerformanceEvaluationSchema.index({ periodStart: 1, periodEnd: 1 });

module.exports = mongoose.model('PerformanceEvaluation', PerformanceEvaluationSchema);