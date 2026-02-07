const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// @route   POST /api/generate
// @desc    Generate content
router.post('/generate', aiController.generateContent);

// @route   GET /api/templates
// @desc    Get all templates
router.get('/templates', aiController.getTemplates);

// @route   GET /api/local-terms
// @desc    Get local terms
router.get('/local-terms', aiController.getLocalTerms);

// @route   POST /api/improve
// @desc    Improve existing content
router.post('/improve', aiController.improveContent);

// @route   POST /api/localize
// @desc    Localize content
router.post('/localize', aiController.localizeContent);

module.exports = router;

// Tambahkan route ini:
router.get('/test-ai', async (req, res) => {
    try {
        const aiGenerator = require('../utils/aiGenerator');
        const status = await aiGenerator.getAIStatus();
        
        // Test generate content
        const testContent = await aiGenerator.generateAIContent({
            topic: "Kopi Kekinian di Indonesia",
            tone: "casual",
            details: "Trend kopi dengan rasa lokal",
            length: 100
        });
        
        res.json({
            success: true,
            aiStatus: status,
            testContent: testContent,
            message: "AI integration test successful"
        });
    } catch (error) {
        console.error('AI Test Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});