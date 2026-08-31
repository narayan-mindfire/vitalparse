const express = require('express');
const multer = require('multer');
const router = express.Router();
const documentController = require('../controllers/documentController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.post('/:id/retry', documentController.retryDocument);

module.exports = router;
