import express from 'express';
import { getSiteSettings, updateSiteSettings, addSiteSettings } from '../Controller.js/SiteSettingsController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for logo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, 'site-logo-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = express.Router();

// GET site settings
router.get('/', getSiteSettings);

// UPDATE site settings (admin only, with logo upload)
router.put('/', upload.single('siteLogo'), updateSiteSettings);

// ADD site settings (admin only, with logo upload)
router.post('/', upload.single('siteLogo'), addSiteSettings);

export default router; 