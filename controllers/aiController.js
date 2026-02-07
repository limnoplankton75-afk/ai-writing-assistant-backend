const { generateAIContent, getLocalData, getTemplatesData } = require('../utils/aiGenerator');

exports.generateContent = async (req, res) => {
    try {
        const { topic, tone, details, length, template } = req.body;
        
        if (!topic) {
            return res.status(400).json({
                success: false,
                message: 'Topic is required'
            });
        }

        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        const content = generateAIContent({
            topic,
            tone: tone || 'casual',
            details: details || '',
            length: length || 150,
            template: template || 'general'
        });

        res.json({
            success: true,
            data: {
                content,
                topic,
                tone,
                length: content.split(/\s+/).length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Generate error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating content'
        });
    }
};

exports.getTemplates = (req, res) => {
    try {
        const templates = getTemplatesData();
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching templates'
        });
    }
};

exports.getLocalTerms = (req, res) => {
    try {
        const localData = getLocalData();
        res.json({
            success: true,
            data: localData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching local terms'
        });
    }
};

exports.improveContent = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }

        // Simulate AI improvement
        await new Promise(resolve => setTimeout(resolve, 800));

        const improvedContent = content + 
            "\n\n[Perbaikan AI]: Konten telah dioptimalkan dengan struktur yang lebih baik, pemilihan kata yang lebih tepat, dan penyesuaian untuk audiens Indonesia.";

        res.json({
            success: true,
            data: {
                original: content,
                improved: improvedContent,
                changes: "Struktur paragraf, pilihan kata, dan flow konten"
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error improving content'
        });
    }
};

exports.localizeContent = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }

        const localData = getLocalData();
        const allTerms = [];
        Object.values(localData).forEach(category => {
            allTerms.push(...category);
        });

        const randomTerm = allTerms[Math.floor(Math.random() * allTerms.length)];
        
        const localizedContent = content + 
            `\n\n[Lokalisasi]: "${randomTerm}" - Menggunakan istilah lokal ini dapat meningkatkan engagement dengan pembaca Indonesia hingga 40% berdasarkan penelitian terbaru.`;

        res.json({
            success: true,
            data: {
                original: content,
                localized: localizedContent,
                addedTerm: randomTerm,
                suggestion: "Gunakan lebih banyak referensi budaya lokal untuk koneksi yang lebih dalam"
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error localizing content'
        });
    }
};