const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Simple admin-key auth for write operations (good enough for a portfolio demo;
// swap for real auth if this ever needs to be more than that).
function requireAdminKey(req, res, next) {
  const key = req.header('x-admin-key');
  if (!process.env.ADMIN_API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: ADMIN_API_KEY not set' });
  }
  if (key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET /api/projects - public, returns all projects ordered for display
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: 1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - admin only, add a new project
router.post('/', requireAdminKey, async (req, res) => {
  try {
    const { title, description, tech, link, image_path, order } = req.body;
    if (!title || !description || !link) {
      return res.status(400).json({ error: 'title, description, and link are required' });
    }
    const project = await Project.create({ title, description, tech, link, image_path, order });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - admin only, update a project
router.put('/:id', requireAdminKey, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - admin only
router.delete('/:id', requireAdminKey, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
