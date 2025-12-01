// controllers/performanceController.js
const fs = require('fs');
const path = require('path');
const Income = require('../models/Income');
const Attendance = require('../models/Attendance');
const PerformanceEvaluation = require('../models/PerformanceEvaluation');
const File = require('../models/File');
const { scanFile } = require('../utils/virusScanner');
const mongoose = require('mongoose');

const REPORT_DIR = path.join(__dirname, '..', 'uploads', 'reports');

// Ensure report dir exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Compute metrics
const computeMetrics = async (start, end) => {
  const incomeAgg = await Income.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const incomeTotal = incomeAgg[0]?.total || 0;

  const attendanceStats = await Attendance.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const attendance = { present: 0, absent: 0, late: 0, halfDay: 0, remote: 0 };
  attendanceStats.forEach(s => {
    if (s._id === 'present') attendance.present = s.count;
    if (s._id === 'absent') attendance.absent = s.count;
    if (s._id === 'late') attendance.late = s.count;
    if (s._id === 'half-day') attendance.halfDay = s.count;
    if (s._id === 'remote') attendance.remote = s.count;
  });

  return { incomeTotal, attendance };
};

// Generate simple text report and save File record, scanned
const generateReportFile = async (metrics, start, end, userId) => {
  const filename = `performance_${start.toISOString().slice(0,10)}_${end.toISOString().slice(0,10)}_${Date.now()}.txt`;
  const filePath = path.join(REPORT_DIR, filename);
  const content = [
    `Performance Report`,
    `Period: ${start.toISOString()} - ${end.toISOString()}`,
    ``,
    `Income Total: ${metrics.incomeTotal.toFixed(2)}`,
    `Attendance:`,
    `  Present: ${metrics.attendance.present}`,
    `  Absent: ${metrics.attendance.absent}`,
    `  Late: ${metrics.attendance.late}`,
    `  Half-day: ${metrics.attendance.halfDay}`,
    `  Remote: ${metrics.attendance.remote}`,
  ].join('\n');
  fs.writeFileSync(filePath, content, 'utf8');

  // Scan
  const scanRes = await scanFile(filePath);
  if (!scanRes.ok) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    const msg = scanRes.error === 'ScannerUnavailable' ? 'Virus scanner unavailable' : 'Virus scan error';
    const err = new Error(msg);
    err.statusCode = 503;
    throw err;
  }
  if (scanRes.isInfected) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    const err = new Error('Generated report infected');
    err.statusCode = 400;
    throw err;
  }

  // Save File record
  const fileRecord = await File.create({
    originalName: filename,
    filename,
    path: filePath,
    size: Buffer.byteLength(content, 'utf8'),
    mimetype: 'text/plain',
    uploadedBy: userId,
    scan: { status: 'clean', details: scanRes.details }
  });
  return fileRecord;
};

// @route POST /api/performance/evaluate
// @access Private (permission: performance.create)
exports.evaluatePerformance = async (req, res) => {
  try {
    const { periodStart, periodEnd, notes } = req.body;
    if (!periodStart || !periodEnd) {
      return res.status(400).json({ message: 'periodStart and periodEnd are required' });
    }
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const metrics = await computeMetrics(start, end);
    const fileRecord = await generateReportFile(metrics, start, end, req.user.id);

    const evalRecord = await PerformanceEvaluation.create({
      periodStart: start,
      periodEnd: end,
      metrics,
      evaluator: req.user.id,
      reportFile: fileRecord._id,
      notes
    });

    res.status(201).json(evalRecord);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

// @route GET /api/performance
// @access Private (permission: performance.view)
exports.listEvaluations = async (req, res) => {
  try {
    const records = await PerformanceEvaluation.find()
      .populate('evaluator', 'name email role')
      .populate('reportFile', 'originalName size mimetype createdAt');
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/performance/:id
// @access Private (permission: performance.view)
exports.getEvaluation = async (req, res) => {
  try {
    const record = await PerformanceEvaluation.findById(req.params.id)
      .populate('evaluator', 'name email role')
      .populate('reportFile');
    if (!record) return res.status(404).json({ message: 'Evaluation not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add employee rating to an evaluation
// @route POST /api/performance/rate
// @access Private (permission: performance.create)
exports.addRating = async (req, res) => {
  try {
    const { evaluationId, employeeId, ratingType = 'stars', ratingValue, ratedAt, notes = '' } = req.body;
    if (!evaluationId || !employeeId || ratingValue === undefined) {
      return res.status(400).json({ message: 'evaluationId, employeeId and ratingValue are required' });
    }
    if (!['stars', 'percentage'].includes(ratingType)) {
      return res.status(400).json({ message: 'Invalid ratingType' });
    }
    if (ratingType === 'stars' && (ratingValue < 1 || ratingValue > 5)) {
      return res.status(400).json({ message: 'Stars rating must be between 1 and 5' });
    }
    if (ratingType === 'percentage' && (ratingValue < 0 || ratingValue > 100)) {
      return res.status(400).json({ message: 'Percentage rating must be between 0 and 100' });
    }

    const evalRecord = await PerformanceEvaluation.findById(evaluationId);
    if (!evalRecord) return res.status(404).json({ message: 'Evaluation not found' });

    evalRecord.ratings = evalRecord.ratings || [];
    evalRecord.ratings.push({
      employee: employeeId,
      ratingType,
      ratingValue,
      ratedAt: ratedAt ? new Date(ratedAt) : new Date(),
      evaluator: req.user.id,
      notes
    });

    await evalRecord.save();

    const populated = await PerformanceEvaluation.findById(evaluationId)
      .populate('ratings.employee', 'name email')
      .populate('ratings.evaluator', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List ratings (flattened)
// @route GET /api/performance/ratings
// @access Private (permission: performance.view)
exports.listRatings = async (req, res) => {
  try {
    const { evaluationId } = req.query;

    // Authorization: allow admins/managers; employees can view only their own; others need performance.view
    const role = req.user?.role;
    const hasViewPerm = req.user?.permissions?.performance?.view;
    const isAdminOrManager = role === 'admin' || role === 'manager';
    const isEmployee = role === 'employee';
    if (!isAdminOrManager && !isEmployee && !hasViewPerm) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Determine employee scope
    let employeeId = undefined;
    if (isEmployee) {
      // Employees are scoped to their own record only
      employeeId = req.user?.employee?._id || req.user?.employee;
      if (!employeeId) {
        return res.status(400).json({ message: 'Employee mapping not found for user' });
      }
    } else {
      // Admins/managers (or users with view permission) may filter by employeeId
      employeeId = req.query.employeeId;
    }

    const pipeline = [];
    if (evaluationId) {
      pipeline.push({ $match: { _id: new mongoose.Types.ObjectId(evaluationId) } });
    }
    pipeline.push({ $unwind: '$ratings' });
    if (employeeId) {
      pipeline.push({ $match: { 'ratings.employee': new mongoose.Types.ObjectId(employeeId) } });
    }
    pipeline.push(
      { $lookup: { from: 'employees', localField: 'ratings.employee', foreignField: '_id', as: 'employee' } },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'ratings.evaluator', foreignField: '_id', as: 'evaluator' } },
      { $unwind: { path: '$evaluator', preserveNullAndEmptyArrays: true } },
      { $project: {
          evaluationId: '$_id',
          periodStart: 1,
          periodEnd: 1,
          rating: '$ratings',
          employee: { _id: '$employee._id', name: '$employee.name', email: '$employee.email' },
          evaluator: { _id: '$evaluator._id', name: '$evaluator.name', email: '$evaluator.email' }
        }
      },
      { $sort: { 'rating.ratedAt': -1 } }
    );

    const results = await PerformanceEvaluation.aggregate(pipeline);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};