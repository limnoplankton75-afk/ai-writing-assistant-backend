require('dotenv').config();

const config = {
    // Server
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Frontend/Client URLs
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
    
    // CORS Configuration
    corsOptions: {
        origin: function (origin, callback) {
            // Izinkan semua origin dalam development
            if (config.nodeEnv === 'development') {
                callback(null, true);
                return;
            }
            
            // Izinkan hanya origin tertentu dalam production
            const allowedOrigins = [
                config.frontendUrl,
                'http://localhost:8080',
                'http://127.0.0.1:5500',
                'http://localhost:5500',
                'https://ai-writing-assistant.vercel.app'
            ];
            
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.warn(`🚫 CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Length', 'X-API-Version'],
        maxAge: 86400 // 24 jam
    },
    
    // AI Configuration
    aiConfig: {
        useRealAI: process.env.USE_REAL_AI === 'true',
        groqApiKey: process.env.GROQ_API_KEY || '',
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        defaultModel: 'mixtral-8x7b-32768',
        maxTokens: 1000,
        temperature: 0.7
    },
    
    // Database
    databaseConfig: {
        enableDatabase: process.env.ENABLE_DATABASE === 'true',
        databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/ai-assistant',
        collectionName: 'generated_contents'
    },
    
    // Security
    securityConfig: {
        enableAuth: process.env.ENABLE_AUTH === 'true',
        jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        apiKeyHeader: 'X-API-Key',
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 menit
            max: 100 // 100 request per windowMs
        }
    },
    
    // Content Settings
    contentConfig: {
        maxContentLength: 5000,
        defaultLanguage: 'indonesia',
        availableTones: ['formal', 'casual', 'professional', 'friendly', 'persuasive'],
        availableTemplates: ['product-description', 'social-media', 'blog-article']
    },
    
    // Logging
    loggingConfig: {
        enableLogging: true,
        logLevel: process.env.LOG_LEVEL || 'info',
        logFile: 'logs/server.log',
        logRequests: true
    }
};

// Helper untuk logging config saat startup
config.logConfig = function() {
    console.log('\n📋 ============ KONFIGURASI SERVER ============');
    console.log(`🌐 Environment: ${this.nodeEnv}`);
    console.log(`🚪 Port: ${this.port}`);
    console.log(`🔗 Frontend URL: ${this.frontendUrl}`);
    console.log(`🤖 AI Real: ${this.aiConfig.useRealAI ? 'AKTIF ✅' : 'DEMO ⚠️'}`);
    console.log(`🗄️ Database: ${this.databaseConfig.enableDatabase ? 'AKTIF' : 'NON-AKTIF'}`);
    console.log(`🔐 Authentication: ${this.securityConfig.enableAuth ? 'AKTIF' : 'NON-AKTIF'}`);
    
    console.log('\n🤖 STATUS LAYANAN AI:');
    console.log(`   • Groq: ${this.aiConfig.groqApiKey ? 'TERKONFIGURASI ✅' : 'TIDAK ADA ❌'}`);
    console.log(`   • OpenAI: ${this.aiConfig.openaiApiKey ? 'TERKONFIGURASI ✅' : 'TIDAK ADA ❌'}`);
    console.log(`   • Gemini: ${this.aiConfig.geminiApiKey ? 'TERKONFIGURASI ✅' : 'TIDAK ADA ❌'}`);
    
    console.log('\n🔧 FITUR:');
    console.log(`   • Max Content Length: ${this.contentConfig.maxContentLength} karakter`);
    console.log(`   • Default Language: ${this.contentConfig.defaultLanguage}`);
    console.log(`   • Available Templates: ${this.contentConfig.availableTemplates.length}`);
    
    console.log('📋 ===========================================\n');
};

// Validasi config
config.validate = function() {
    const errors = [];
    const warnings = [];
    
    // Validation for production
    if (this.nodeEnv === 'production') {
        if (this.aiConfig.useRealAI) {
            if (!this.aiConfig.groqApiKey && !this.aiConfig.openaiApiKey && !this.aiConfig.geminiApiKey) {
                errors.push('AI Real diaktifkan tapi tidak ada API key yang dikonfigurasi');
            }
        }
        
        if (this.securityConfig.jwtSecret === 'dev-secret-key-change-in-production') {
            errors.push('Ganti JWT_SECRET di production!');
        }
        
        if (this.frontendUrl.includes('localhost')) {
            warnings.push('Frontend URL masih menggunakan localhost di production');
        }
    }
    
    // Validation for development
    if (this.nodeEnv === 'development') {
        if (!this.aiConfig.groqApiKey) {
            warnings.push('GROQ_API_KEY tidak dikonfigurasi. AI akan berjalan di mode demo.');
        }
    }
    
    // Log warnings
    if (warnings.length > 0) {
        console.warn('⚠️  Peringatan Konfigurasi:');
        warnings.forEach(warning => console.warn(`   • ${warning}`));
    }
    
    return errors;
};

// Helper untuk mendapatkan config public (tanpa API keys)
config.getPublicConfig = function() {
    return {
        environment: this.nodeEnv,
        features: {
            realAI: this.aiConfig.useRealAI,
            database: this.databaseConfig.enableDatabase,
            authentication: this.securityConfig.enableAuth
        },
        content: {
            defaultLanguage: this.contentConfig.defaultLanguage,
            availableTones: this.contentConfig.availableTones,
            maxLength: this.contentConfig.maxContentLength
        },
        server: {
            port: this.port,
            corsEnabled: true,
            rateLimit: this.securityConfig.rateLimit.max
        }
    };
};

module.exports = config;