import SiteSettings from '../Model/SiteSettingsModel.js';
import path from 'path';
import fs from 'fs';

// Get current site settings
export const getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      // Create default if not exists
      settings = await SiteSettings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch site settings', details: err.message });
  }
};

// Add site settings (only if none exist)
export const addSiteSettings = async (req, res) => {
  try {
    const existing = await SiteSettings.findOne();
    if (existing) {
      return res.status(400).json({ error: 'Settings already exist. Use update instead.' });
    }
    let data = req.body;
    if (req.file) {
      // Always store only the relative path for logo
      const relPath = req.file.path.replace(/\\/g, '/').split('uploads/').pop();
      data.siteLogo = relPath ? `uploads/${relPath}` : '';
    }
    const settings = await SiteSettings.create(data);
    res.status(201).json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add site settings', details: err.message });
  }
};

// Update site settings (admin only, only if exists)
export const updateSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'No settings found. Please add settings first.' });
    }
    const { siteTitle, siteDescription, cashoutTax, postProjectTax, addFundTax } = req.body;
    if (siteTitle !== undefined) settings.siteTitle = siteTitle;
    if (siteDescription !== undefined) settings.siteDescription = siteDescription;
    if (cashoutTax !== undefined) settings.cashoutTax = cashoutTax;
    if (postProjectTax !== undefined) settings.postProjectTax = postProjectTax;
    if (addFundTax !== undefined) settings.addFundTax = addFundTax;
    // Handle logo upload (if file provided)
    if (req.file) {
      if (settings.siteLogo && fs.existsSync(settings.siteLogo)) {
        fs.unlinkSync(settings.siteLogo);
      }
      // Always store only the relative path for logo
      const relPath = req.file.path.replace(/\\/g, '/').split('uploads/').pop();
      settings.siteLogo = relPath ? `uploads/${relPath}` : '';
    }
    // Add all other fields dynamically
    Object.keys(req.body).forEach((key) => {
      if (key !== 'siteTitle' && key !== 'siteDescription' && key !== 'cashoutTax' && key !== 'postProjectTax' && key !== 'addFundTax') {
        settings[key] = req.body[key];
      }
    });
    settings.updatedAt = new Date();
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update site settings', details: err.message });
  }
}; 