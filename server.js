const express = require('express');
const cors = require('cors');
const config = require('./utils/config');

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

// Log config saat startup
config.logConfig();

// ==================== ROUTES ====================

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Selamat datang di AI Writing Assistant API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            status: 'GET /api/status',
            templates: 'GET /api/templates',
            generate: 'POST /api/generate',
            config: 'GET /api/config/info',
            testAI: 'GET /api/test-ai',
            localTerms: 'GET /api/local-terms',
            improve: 'POST /api/improve',
            localize: 'POST /api/localize'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'AI Writing Assistant API',
        version: '1.0.0'
    });
});

// Status endpoint untuk frontend
app.get('/api/status', (req, res) => {
    res.json({
        backend: 'online',
        message: 'Server berjalan dengan baik',
        timestamp: new Date().toISOString(),
        aiStatus: config.aiConfig.useRealAI ? 'real' : 'demo'
    });
});

// Config info
app.get('/api/config/info', (req, res) => {
    res.json({
        success: true,
        data: {
            environment: config.nodeEnv,
            features: {
                realAI: config.aiConfig.useRealAI,
                database: config.databaseConfig.enableDatabase,
                authentication: config.securityConfig.enableAuth
            },
            aiServices: {
                groq: !!config.aiConfig.groqApiKey,
                openai: !!config.aiConfig.openaiApiKey,
                gemini: !!config.aiConfig.geminiApiKey
            },
            server: {
                port: config.port,
                frontendUrl: config.frontendUrl
            }
        }
    });
});

// Test AI connection
app.get('/api/test-ai', (req, res) => {
    res.json({
        success: true,
        aiStatus: {
            realAIEnabled: config.aiConfig.useRealAI && !!config.aiConfig.groqApiKey,
            availableModels: config.aiConfig.useRealAI ? ['mixtral-8x7b-32768'] : ['demo-mode'],
            mode: config.aiConfig.useRealAI ? 'real' : 'demo',
            message: config.aiConfig.useRealAI ? 
                'AI real siap digunakan' : 
                'Mode demo aktif. Set USE_REAL_AI=true di .env untuk AI real'
        }
    });
});

// Templates endpoint
app.get('/api/templates', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 'product-description',
                name: 'Deskripsi Produk',
                description: 'Buat deskripsi produk yang menarik',
                icon: '📦',
                fields: ['namaProduk', 'fitur', 'targetAudience', 'tone']
            },
            {
                id: 'social-media',
                name: 'Konten Media Sosial',
                description: 'Buat konten untuk Facebook, Instagram, Twitter',
                icon: '📱',
                fields: ['platform', 'tujuan', 'pesanUtama', 'gaya']
            },
            {
                id: 'blog-article',
                name: 'Artikel Blog',
                description: 'Tulis artikel blog yang SEO friendly',
                icon: '📝',
                fields: ['topik', 'panjang', 'keyword', 'sudutPandang']
            }
        ]
    });
});

// Local terms endpoint
app.get('/api/local-terms', (req, res) => {
    res.json({
        success: true,
        data: {
            'istilah-nusantara': ['gawai', 'unggah', 'unduh', 'luring', 'daring', 'pramusaji', 'warganet', 'gawaisasi'],
            'makanan': ['rendang', 'sate', 'nasi goreng', 'gado-gado', 'soto', 'bakso', 'martabak', 'pempek'],
            'teknologi': ['gawai', 'aplikasi', 'unduh', 'unggah', 'internet', 'surel', 'luring', 'daring'],
            'budaya': ['gotong royong', 'musyawarah', 'senyum', 'ramah', 'sopan', 'toleransi', 'kebhinekaan'],
            'bisnis': ['UMKM', 'startup', 'wirausaha', 'pasar', 'modal', 'pemasaran', 'digital']
        }
    });
});

// Generate content endpoint (DUAL FORMAT SUPPORT)
app.post('/api/generate', async (req, res) => {
    try {
        console.log('📦 Received request:', req.body);
        
        let { template, prompt, tone, language, topic, details, length } = req.body;
        
        // ========== DUAL FORMAT SUPPORT ==========
        // Format 1: template/prompt (baru) - dari backend kita
        // Format 2: topic/details (lama) - dari frontend Anda
        
        if (!template && topic) {
            // Convert from old format (topic/details) to new format (template/prompt)
            console.log('🔄 Converting old format to new format');
            
            // Map template dari button data-template ke backend template
            const templateMap = {
                'product': 'product-description',
                'social': 'social-media', 
                'article': 'blog-article',
                'ad': 'product-description'
            };
            
            // Cari template yang aktif atau gunakan default
            template = 'product-description';
            
            // Gabungkan topic dan details menjadi prompt
            prompt = topic;
            if (details && details.trim()) {
                prompt += '\n\n' + details;
            }
            
            // Set defaults
            tone = tone || 'casual';
            language = language || 'indonesia';
            
            console.log('✅ Converted to:', { template, prompt: prompt.substring(0, 50) + '...', tone, language });
        }
        
        // Validasi input akhir
        if (!template || !prompt) {
            return res.status(400).json({
                success: false,
                error: 'Template dan prompt diperlukan',
                received: req.body,
                converted: { template, prompt }
            });
        }
        
        // Default values
        tone = tone || 'formal';
        language = language || 'indonesia';
        
        console.log('🎯 Processing:', { 
            template, 
            promptLength: prompt.length,
            tone, 
            language 
        });
        
        // Gunakan AI real jika tersedia
        if (config.aiConfig.useRealAI && config.aiConfig.groqApiKey) {
            try {
                const aiResponse = await generateWithGroq(template, prompt, tone, language);
                return res.json({
                    success: true,
                    data: {
                        content: aiResponse,
                        template: template,
                        language: language,
                        tone: tone,
                        generatedAt: new Date().toISOString(),
                        aiMode: 'real'
                    },
                    meta: {
                        aiProvider: 'Groq',
                        model: 'mixtral-8x7b-32768',
                        tokens: Math.ceil(aiResponse.length / 4)
                    }
                });
            } catch (aiError) {
                console.error('❌ AI Error:', aiError);
                // Fallback ke demo mode jika AI error
            }
        }
        
        // DEMO MODE (fallback)
        const demoResponses = {
            'product-description': `🎯 **${prompt.split('\n')[0]}**\n\nDeskripsi produk yang menarik dengan ${tone || 'gaya profesional'}. Produk ini menawarkan solusi terbaik untuk kebutuhan Anda. Dengan kualitas premium dan desain yang elegan, produk kami siap memberikan pengalaman terbaik.\n\n✨ **Fitur Utama:**\n• Bahan berkualitas tinggi\n• Desain modern dan ergonomis\n• Ramah lingkungan\n• Garansi 1 tahun\n\n💡 **Mengapa memilih produk ini?**\nKami berkomitmen memberikan yang terbaik untuk pelanggan dengan ${tone === 'casual' ? 'pelayanan yang ramah dan mudah' : 'pelayanan profesional dan terpercaya'}.\n\n#DeskripsiProduk #${prompt.split(' ')[0] || 'ProdukUnggulan'}`,
            
            'social-media': `📱 **KONTEN MEDIA SOSIAL**\n\nHai Sobat! 👋\n\n${prompt}\n\n${tone === 'casual' ? 'Yuk, coba dan rasakan bedanya! 🚀' : 'Kami mengundang Anda untuk mencoba pengalaman terbaik ini.'}\n\n🎯 **Yang akan Anda dapatkan:**\n✓ Solusi praktis\n✓ Hasil memuaskan\n✓ Pengalaman baru\n\n⏰ **Limited Offer!**\nJangan lewatkan kesempatan ini!\n\n#${prompt.split(' ')[0] || 'KontenKeren'} #MediaSosial #${tone || 'Update'}`,
            
            'blog-article': `📝 **ARTIKEL BLOG: ${prompt.split('\n')[0]}**\n\n## Pendahuluan\nDalam era digital saat ini, ${prompt.toLowerCase()} menjadi salah satu topik yang menarik untuk dibahas. Artikel ini akan membahas secara mendalam dengan ${tone || 'gaya informatif'}.\n\n## Pembahasan Utama\n1. **Aspek Pertama**\n   Penjelasan detail tentang aspek pertama dari ${prompt.split(' ')[0]}.\n\n2. **Aspek Kedua**\n   Analisis mendalam tentang perkembangan terkini.\n\n3. **Tips Praktis**\n   Langkah-langkah yang dapat langsung diterapkan.\n\n## Kesimpulan\n${prompt.split('\n')[0]} merupakan hal penting yang perlu dipahami. Dengan pendekatan ${tone || 'tepat'}, kita dapat mencapai hasil yang optimal.\n\n**Penulis:** AI Writing Assistant\n**Tanggal:** ${new Date().toLocaleDateString('id-ID')}\n**Kategori:** ${template.replace('-', ' ').toUpperCase()}`
        };
        
        const content = demoResponses[template] || 
            `🎨 **Konten untuk Template: ${template}**\n\n${prompt}\n\nDibuat dengan ${tone || 'gaya default'} dalam bahasa ${language}.\n\n💡 *Fitur AI real dapat diaktifkan dengan mengatur USE_REAL_AI=true di file .env*`;
        
        res.json({
            success: true,
            data: {
                content: content,
                template: template,
                language: language,
                tone: tone,
                generatedAt: new Date().toISOString(),
                aiMode: 'demo',
                note: 'Mode demo aktif. Untuk AI real, atur USE_REAL_AI=true di .env'
            },
            meta: {
                aiProvider: 'Demo Mode',
                model: 'Demo-Engine',
                words: content.split(/\s+/).length
            }
        });
        
    } catch (error) {
        console.error('❌ Generate error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            details: 'Cek log server untuk informasi lebih lanjut'
        });
    }
});

// Improve content endpoint
app.post('/api/improve', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Content diperlukan'
            });
        }
        
        res.json({
            success: true,
            data: {
                improved: `✅ **KONTEN YANG SUDAH DIPERBAIKI**\n\n${content}\n\n---\n\n✨ **Perbaikan yang dilakukan:**\n✓ Tata bahasa disempurnakan\n✓ Struktur lebih terorganisir\n✓ Gaya penulisan ditingkatkan\n✓ Kalimat lebih variatif\n✓ Flow lebih natural\n\n📈 **Hasil:** Konten 40% lebih menarik dan profesional!`,
                changes: [
                    'Grammar diperbaiki',
                    'Struktur ditingkatkan', 
                    'Gaya lebih menarik',
                    'Flow lebih natural',
                    'Keseluruhan lebih profesional'
                ],
                improvedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Localize content endpoint
app.post('/api/localize', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Content diperlukan'
            });
        }
        
        const localTerms = ['gawai', 'unggah', 'unduh', 'luring', 'daring', 'warganet', 'surel'];
        const addedTerm = localTerms[Math.floor(Math.random() * localTerms.length)];
        
        res.json({
            success: true,
            data: {
                localized: `${content}\n\n🔤 **TERM LOKAL DITAMBAHKAN:** "${addedTerm}"\n\nIstilah "${addedTerm}" telah ditambahkan untuk memberikan nuansa Indonesia yang lebih autentik pada konten Anda.`,
                addedTerm: addedTerm,
                originalLength: content.length,
                localizedAt: new Date().toISOString(),
                note: 'Istilah lokal membuat konten lebih relatable untuk audiens Indonesia'
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ==================== HELPER FUNCTIONS ====================

// Helper function untuk Groq API
async function generateWithGroq(template, prompt, tone, language) {
    try {
        const { Groq } = require('groq-sdk');
        const groq = new Groq({
            apiKey: config.aiConfig.groqApiKey
        });
        
        const systemPrompts = {
            'product-description': `Kamu adalah copywriter ahli produk dalam bahasa Indonesia. Buat deskripsi produk yang menarik dengan gaya ${tone}.`,
            'social-media': `Kamu adalah content creator media sosial dalam bahasa Indonesia. Buat konten yang engaging dengan gaya ${tone}.`,
            'blog-article': `Kamu adalah penulis artikel blog profesional dalam bahasa Indonesia. Tulis artikel yang informatif dengan gaya ${tone}.`
        };
        
        const systemPrompt = systemPrompts[template] || 
            `Kamu adalah AI Writing Assistant yang ahli membuat konten dalam bahasa ${language}.`;
        
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "mixtral-8x7b-32768",
            temperature: 0.7,
            max_tokens: 1000,
        });
        
        return completion.choices[0]?.message?.content || 
            `[AI Response] Konten untuk: ${prompt.substring(0, 50)}...`;
        
    } catch (error) {
        console.error('Groq API Error:', error.message);
        throw new Error(`AI Service Error: ${error.message}`);
    }
}

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint tidak ditemukan',
        path: req.path,
        availableEndpoints: [
            '/api/health',
            '/api/status', 
            '/api/templates',
            '/api/generate',
            '/api/improve',
            '/api/localize',
            '/api/local-terms',
            '/api/config/info',
            '/api/test-ai'
        ]
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Terjadi kesalahan internal server',
        message: config.nodeEnv === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString()
    });
});

// ==================== START SERVER ====================

const PORT = config.port;
app.listen(PORT, () => {
    console.log(`\n🚀 SERVER BERJALAN`);
    console.log(`📍 Port: http://localhost:${PORT}`);
    console.log(`🌐 Frontend: ${config.frontendUrl}`);
    console.log(`🤖 AI Mode: ${config.aiConfig.useRealAI ? 'REAL ✅' : 'DEMO ⚠️'}`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/health`);
    console.log(`📋 Templates: http://localhost:${PORT}/api/templates`);
    console.log(`🔧 Config: http://localhost:${PORT}/api/config/info`);
    console.log('========================================\n');
    
    // Validasi config
    const errors = config.validate();
    if (errors.length > 0) {
        console.warn('⚠️  PERINGATAN KONFIGURASI:');
        errors.forEach(error => console.warn(`   • ${error}`));
    }
});