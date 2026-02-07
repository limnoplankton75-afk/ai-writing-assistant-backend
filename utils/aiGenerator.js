const localData = require('./localData');
const groqService = require('./groqService');
const config = require('./config');

exports.generateAIContent = async (params) => {
    const { topic, tone = 'casual', details = '', length = 150 } = params;
    
    // Jika real AI enabled dan Groq tersedia
    if (config.aiConfig.useRealAI && groqService.available) {
        try {
            console.log('🤖 Using Groq AI for content generation');
            const content = await groqService.generateLocalContent(
                topic, tone, details, length
            );
            
            // Tambahkan local flavor
            return localData.enhanceWithLocalFlavor(content, {
                includeTerms: true,
                includeCulturalRefs: true
            });
            
        } catch (error) {
            console.warn('⚠️ Groq API failed, falling back to simulated AI:', error.message);
            // Fallback ke simulated AI
        }
    }
    
    // Simulated AI (fallback)
    console.log('🔄 Using simulated AI response');
    const templates = {
        formal: [
            "Berdasarkan analisis terkini, {topic} merupakan aspek yang penting dalam konteks perkembangan di Indonesia. {details}",
            "Dalam upaya meningkatkan kualitas {topic}, diperlukan pendekatan yang komprehensif dan berkelanjutan. {details}"
        ],
        casual: [
            "Hai! Lagi cari info tentang {topic} yang kekinian? Nah, kebetulan banget nih ada yang lagi hits! {details}",
            "Wah, {topic} lagi jadi perbincangan nih di kalangan anak muda. Mau tahu yang terbaru? Yuk simak! {details}"
        ]
    };
    
    const toneTemplates = templates[tone] || templates.casual;
    const template = toneTemplates[Math.floor(Math.random() * toneTemplates.length)];
    
    let content = template
        .replace(/{topic}/g, topic)
        .replace(/{details}/g, details || 'Berikut adalah informasi terkini yang perlu diketahui.');
    
    return localData.enhanceWithLocalFlavor(content, {
        includeTerms: true,
        includeCulturalRefs: true
    });
};

// Tambahkan endpoint untuk cek status AI
exports.getAIStatus = async () => {
    const groqStatus = groqService.available 
        ? await groqService.testConnection()
        : { available: false, message: 'Groq API key not configured' };
    
    return {
        realAIEnabled: config.aiConfig.useRealAI,
        services: {
            groq: groqStatus,
            openai: !!config.aiConfig.openaiApiKey,
            gemini: !!config.aiConfig.geminiApiKey
        },
        fallbackAI: 'Simulated AI (Always available)'
    };
};