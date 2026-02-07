const localData = require('./localData');

// ... kode yang ada ...

exports.generateAIContent = (params) => {
    const { topic, tone = 'casual', details = '', length = 150 } = params;
    
    const templates = toneTemplates[tone] || toneTemplates.casual;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    let content = template
        .replace(/{topic}/g, topic)
        .replace(/{details}/g, details || 'Berikut adalah informasi terkini yang perlu diketahui.');
    
    // Tambahkan panjang konten sesuai request
    const words = content.split(/\s+/).length;
    if (words < length) {
        const additionalSentences = [
            "Hal ini sangat relevan dengan kondisi masyarakat Indonesia saat ini.",
            "Tidak heran jika banyak yang tertarik dengan perkembangan terbaru ini.",
            "Inovasi-inovasi baru terus bermunculan di berbagai daerah.",
            "Partisipasi aktif dari generasi muda menjadi kunci keberhasilan.",
            "Potensi yang ada sangat besar untuk dikembangkan lebih lanjut."
        ];
        
        while (content.split(/\s+/).length < length) {
            const randomSentence = additionalSentences[Math.floor(Math.random() * additionalSentences.length)];
            content += " " + randomSentence;
        }
    }
    
    // Gunakan LocalDataManager untuk enhance content
    content = localData.enhanceWithLocalFlavor(content, {
        includeTerms: true,
        includeCulturalRefs: true,
        targetRegion: null
    });
    
    return content;
};

exports.getLocalData = () => {
    return localData.getAllLocalTerms();
};

// ... sisa kode ...