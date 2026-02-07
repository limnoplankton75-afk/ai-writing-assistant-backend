const axios = require('axios');
const config = require('./config');

class GroqService {
    constructor() {
        this.apiKey = config.aiConfig.groqApiKey;
        this.baseURL = 'https://api.groq.com/openai/v1';
        this.available = !!this.apiKey;
    }

    async generateContent(prompt, options = {}) {
        if (!this.available) {
            throw new Error('Groq API key not configured');
        }

        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: options.model || 'llama3-8b-8192',
                    messages: [
                        {
                            role: 'system',
                            content: 'Anda adalah AI Writing Assistant yang ahli membuat konten dalam bahasa Indonesia dengan nuansa lokal. Buatlah konten yang autentik, engaging, dan sesuai dengan konteks Indonesia.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: options.maxTokens || 500,
                    temperature: options.temperature || 0.7,
                    top_p: options.topP || 0.9
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 detik timeout
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Groq API Error:', error.response?.data || error.message);
            throw new Error(`Groq API Error: ${error.message}`);
        }
    }

    async generateLocalContent(topic, tone, details, length) {
        const prompt = `Buat konten tentang "${topic}" dengan:
        - Nada: ${tone}
        - Detail: ${details}
        - Panjang: sekitar ${length} kata
        - Bahasa: Indonesia
        - Nuansa: Khas Indonesia, gunakan istilah lokal yang relevan
        - Format: Konten yang siap digunakan, engaging, dan autentik`;

        return await this.generateContent(prompt, {
            maxTokens: Math.min(length * 2, 1000),
            temperature: this.getTemperatureByTone(tone)
        });
    }

    getTemperatureByTone(tone) {
        const temperatures = {
            formal: 0.3,
            casual: 0.7,
            friendly: 0.6,
            persuasive: 0.5,
            local: 0.8
        };
        return temperatures[tone] || 0.7;
    }

    // Test connection
    async testConnection() {
        if (!this.available) return { available: false, message: 'API key not configured' };

        try {
            const response = await axios.get(`${this.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return {
                available: true,
                message: 'Connected successfully',
                models: response.data.data.length
            };
        } catch (error) {
            return {
                available: false,
                message: error.message
            };
        }
    }
}

module.exports = new GroqService();