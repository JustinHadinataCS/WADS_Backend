import mongoose from 'mongoose';
import connectDB from '../config/db.js';

// Define Chat Schema
const chatSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    message: { type: String, required: true },
    response: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: {
        messageType: { type: String, default: 'general' },
        productCategory: String,
        sentiment: String,
        language: String
    }
});

// Create indexes for efficient querying
chatSchema.index({ userId: 1, timestamp: -1 });

// Create Chat model
const Chat = mongoose.model('Chat', chatSchema);

// Product knowledge base with enhanced information
const productContext = `
You are a helpful assistant for Semesta Medika, a medical equipment supplier. 
Our main product categories are:
1. Hospital Products
2. Homecare Products
3. Ward Furnitures

Some of our featured products include:
- U-life Mobile Cart for Laptop (Rp 4.900.000)
  Features: Mobile workstation, adjustable height, laptop holder, cable management
  Use case: Hospital wards, clinics, medical offices

- Examination Couch JCI - 2000EC (Rp 21.750.000)
  Features: Electric height adjustment, memory function, soft padding
  Use case: Medical examinations, patient comfort

- Therapy Couch JCI - 2000TC (Rp 22.500.000)
  Features: Therapeutic design, adjustable sections, premium upholstery
  Use case: Physical therapy, rehabilitation

- Portable Health Check Up Station SK - GS6 (Rp 60.000.000)
  Features: All-in-one health monitoring, portable design
  Use case: Health screenings, mobile clinics

- Health Check Up Kiosk SK-X60HD (Rp 205.000.000)
  Features: Advanced health monitoring, touch screen interface
  Use case: Hospitals, large clinics

- Cordless High Lux LEDLamp (Rp 18.000.000)
  Features: High-intensity lighting, cordless operation
  Use case: Medical procedures, examinations

- Standalone Wireless Micro Camera (Rp 60.000.000)
  Features: HD imaging, wireless transmission
  Use case: Medical imaging, documentation

- Wireless MediCam (Rp 45.000.000)
  Features: Portable medical camera, real-time streaming
  Use case: Telemedicine, medical documentation

Company Information:
- Location: Jl. Kamal Raya Outer Ring Road Mutiara Taman Palem Blok A2 No 28, Cengkareng - Jakarta Barat 11730
- Phone: (021) 29517888, 54396999, 29020168, 29312345
- Email: semestamedikamakmur@gmail.com
- Business Hours: Monday - Friday: 9:00 AM - 5:00 PM
- Service: Installation, maintenance, and technical support available

Please provide accurate information about our products and services. If you're unsure about any specific details, please say so.
`;

export const chatService = {
    /**
     * Process a chat message and store it in MongoDB
     * @param {string} userId - The ID of the user sending the message
     * @param {string} message - The user's message
     * @param {Object} options - Additional options for message processing
     * @returns {Promise<Object>} The AI response and chat record
     */
    async processMessage(userId, message, options = {}) {
        try {
            // Ensure MongoDB connection
            if (!mongoose.connection.readyState) {
                await connectDB();
            }

            // Add conversation context if available
            const conversationContext = options.conversationContext || '';
            
            const prompt = `${productContext}\n\n${conversationContext}\nUser Question: ${message}\n\nPlease provide a helpful response about our products and services. Include relevant product features and use cases when applicable:`;

            // Make direct API call to Gemini 2.0 Flash
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
            }

            const result = await response.json();
            const aiResponse = result.candidates[0].content.parts[0].text;

            // Extract product category and other metadata
            const productCategory = this._extractProductCategory(message);
            const sentiment = this._analyzeSentiment(message);
            const language = this._detectLanguage(message);

            // Store chat in MongoDB
            const chatData = {
                userId,
                message,
                response: aiResponse,
                metadata: {
                    messageType: options.messageType || 'general',
                    productCategory,
                    sentiment,
                    language,
                    ...options.metadata
                }
            };

            const chat = new Chat(chatData);
            await chat.save();

            return {
                success: true,
                chatId: chat._id,
                response: aiResponse,
                metadata: chatData.metadata
            };
        } catch (error) {
            console.error('Error processing message:', error);
            throw new Error(`Chat processing failed: ${error.message}`);
        }
    },

    /**
     * Get chat history for a user with pagination
     * @param {string} userId - The ID of the user
     * @param {Object} options - Pagination and filtering options
     * @returns {Promise<Object>} Paginated chat history
     */
    async getChatHistory(userId, options = {}) {
        try {
            // Ensure MongoDB connection
            if (!mongoose.connection.readyState) {
                await connectDB();
            }

            const {
                limit: limitCount = 20,
                skip = 0,
                startDate = null,
                endDate = null,
                productCategory = null
            } = options;

            // Build query
            const query = { userId };
            
            // Add date range if provided
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) query.timestamp.$gte = new Date(startDate);
                if (endDate) query.timestamp.$lte = new Date(endDate);
            }

            // Add product category filter if provided
            if (productCategory) {
                query['metadata.productCategory'] = productCategory;
            }

            // Execute query with pagination
            const chats = await Chat.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitCount);

            // Get total count for pagination
            const total = await Chat.countDocuments(query);

            return {
                success: true,
                chats,
                hasMore: skip + chats.length < total,
                total
            };
        } catch (error) {
            throw new Error(`Failed to fetch chat history: ${error.message}`);
        }
    },

    /**
     * Delete a chat message
     * @param {string} chatId - The ID of the chat to delete
     * @param {string} userId - The ID of the user (for verification)
     * @returns {Promise<Object>} Deletion result
     */
    async deleteChat(chatId, userId) {
        try {
            // Ensure MongoDB connection
            if (!mongoose.connection.readyState) {
                await connectDB();
            }

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(chatId)) {
                throw new Error('Chat not found or unauthorized');
            }

            const chat = await Chat.findOne({ _id: chatId, userId });
            
            if (!chat) {
                throw new Error('Chat not found or unauthorized');
            }

            await chat.deleteOne();
            return { success: true, message: 'Chat deleted successfully' };
        } catch (error) {
            if (error.message === 'Chat not found or unauthorized') {
                throw error;
            }
            throw new Error(`Failed to delete chat: ${error.message}`);
        }
    },

    /**
     * Update a chat message
     * @param {string} chatId - The ID of the chat to update
     * @param {string} userId - The ID of the user (for verification)
     * @param {Object} updates - The updates to apply
     * @returns {Promise<Object>} Update result
     */
    async updateChat(chatId, userId, updates) {
        try {
            // Ensure MongoDB connection
            if (!mongoose.connection.readyState) {
                await connectDB();
            }

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(chatId)) {
                throw new Error('Chat not found or unauthorized');
            }

            const chat = await Chat.findOne({ _id: chatId, userId });
            
            if (!chat) {
                throw new Error('Chat not found or unauthorized');
            }

            Object.assign(chat, updates);
            await chat.save();

            return { success: true, message: 'Chat updated successfully' };
        } catch (error) {
            if (error.message === 'Chat not found or unauthorized') {
                throw error;
            }
            throw new Error(`Failed to update chat: ${error.message}`);
        }
    },

    /**
     * Extract product category from message
     * @private
     */
    _extractProductCategory(message) {
        const categories = ['Hospital Products', 'Homecare Products', 'Ward Furnitures'];
        const lowerMessage = message.toLowerCase();
        
        for (const category of categories) {
            if (lowerMessage.includes(category.toLowerCase())) {
                return category;
            }
        }
        return null;
    },

    /**
     * Analyze message sentiment
     * @private
     */
    _analyzeSentiment(message) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'helpful'];
        const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'horrible', 'useless'];
        
        const lowerMessage = message.toLowerCase();
        let score = 0;
        
        positiveWords.forEach(word => {
            if (lowerMessage.includes(word)) score++;
        });
        
        negativeWords.forEach(word => {
            if (lowerMessage.includes(word)) score--;
        });
        
        return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
    },

    /**
     * Detect message language
     * @private
     */
    _detectLanguage(message) {
        const indonesianWords = ['apa', 'bagaimana', 'dimana', 'kapan', 'mengapa', 'berapa'];
        const englishWords = ['what', 'how', 'where', 'when', 'why', 'how much'];
        
        const lowerMessage = message.toLowerCase();
        let idScore = 0;
        let enScore = 0;
        
        indonesianWords.forEach(word => {
            if (lowerMessage.includes(word)) idScore++;
        });
        
        englishWords.forEach(word => {
            if (lowerMessage.includes(word)) enScore++;
        });
        
        return idScore > enScore ? 'id' : 'en';
    },

    /**
     * Get user chat statistics
     * @param {string} userId - The ID of the user
     * @returns {Promise<Object>} User chat statistics
     */
    async getUserChatStats(userId) {
        try {
            // Ensure MongoDB connection
            if (!mongoose.connection.readyState) {
                await connectDB();
            }

            const stats = await Chat.aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: null,
                        totalMessages: { $sum: 1 },
                        productCategories: {
                            $push: '$metadata.productCategory'
                        },
                        messageTypes: {
                            $push: '$metadata.messageType'
                        },
                        languages: {
                            $push: '$metadata.language'
                        },
                        sentiments: {
                            $push: '$metadata.sentiment'
                        }
                    }
                }
            ]);

            if (stats.length === 0) {
                return {
                    success: true,
                    stats: {
                        totalMessages: 0,
                        productCategories: {},
                        messageTypes: {},
                        languages: {},
                        sentiments: {
                            positive: 0,
                            neutral: 0,
                            negative: 0
                        }
                    }
                };
            }

            const result = stats[0];
            
            // Process categories
            const categories = {};
            result.productCategories.forEach(cat => {
                if (cat) categories[cat] = (categories[cat] || 0) + 1;
            });

            // Process message types
            const types = {};
            result.messageTypes.forEach(type => {
                if (type) types[type] = (types[type] || 0) + 1;
            });

            // Process languages
            const languages = {};
            result.languages.forEach(lang => {
                if (lang) languages[lang] = (languages[lang] || 0) + 1;
            });

            // Process sentiments
            const sentiments = {
                positive: 0,
                neutral: 0,
                negative: 0
            };
            result.sentiments.forEach(sent => {
                if (sent) sentiments[sent]++;
            });

            return {
                success: true,
                stats: {
                    totalMessages: result.totalMessages,
                    productCategories: categories,
                    messageTypes: types,
                    languages,
                    sentiments
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch chat statistics: ${error.message}`);
        }
    }
}; 