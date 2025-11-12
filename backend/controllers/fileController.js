// controllers/fileController.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const File = require('../models/File');
const { scanFile } = require('../utils/virusScanner');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg'];
const allowedMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png',
  'image/jpeg'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
    const unique = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    cb(null, base + '_' + unique + ext);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext) || !allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Unsupported file type'));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Upload handler with scanning
exports.uploadFile = (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      // Scan uploaded file
      const scanRes = await scanFile(req.file.path);
      if (!scanRes.ok) {
        // Delete file if scanner unavailable or error
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        const msg = scanRes.error === 'ScannerUnavailable' ? 'Virus scanner unavailable' : 'Virus scan error';
        return res.status(503).json({ message: msg });
      }
      if (scanRes.isInfected) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.status(400).json({ message: 'File infected. Upload rejected', details: scanRes.details });
      }

      // Persist metadata
      const record = await File.create({
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedBy: req.user.id,
        scan: { status: 'clean', details: scanRes.details }
      });

      res.status(201).json(record);
    } catch (e) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      res.status(500).json({ message: e.message });
    }
  });
};

// List accessible files
exports.listFiles = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      query = {};
    } else {
      query = { uploadedBy: req.user.id };
    }
    const files = await File.find(query).sort({ createdAt: -1 });
    res.json(files);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Access control: admin/manager or uploader
    if (!(req.user.role === 'admin' || req.user.role === 'manager' || file.uploadedBy.toString() === req.user.id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (file.scan.status !== 'clean') {
      return res.status(400).json({ message: 'File not available for download (not clean)' });
    }

    return res.download(file.path, file.originalName);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Access control: admin/manager or uploader
    if (!(req.user.role === 'admin' || req.user.role === 'manager' || file.uploadedBy.toString() === req.user.id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    try { fs.unlinkSync(file.path); } catch (_) {}
    await file.deleteOne();
    res.json({ message: 'File deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};