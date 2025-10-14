/**
 * GCP Agent Service for Hoopie
 * Handles communication with the GCP backend agent API
 */

export class AgentService {
    constructor() {
        // Get base URL from environment variables
        this.baseUrl = process.env.REACT_APP_AGENT_API_URL || 'http://localhost:8080';
        this.sessions = new Map(); // userId -> sessionId
    }

    /**
     * Send a message to the agent
     * @param {string} message - The message to send
     * @param {Object} user - Firebase user object
     * @returns {Promise<Object>} Agent response
     */
    async sendMessage(message, user) {
        try {
            if (!user?.uid) {
                throw new Error('User authentication required');
            }

            // Get existing session ID for this user
            const sessionId = this.sessions.get(user.uid);
            
            // Get Firebase ID token for authentication
            const token = await user.getIdToken();

            const response = await fetch(`${this.baseUrl}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: message,
                    userId: user.email || user.uid, // Use email for better readability in agent logs
                    firebaseUid: user.uid, // Keep UID for session management
                    sessionId: sessionId // Optional - backend will create new if not provided
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Agent API error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
            }

            const data = await response.json();
            
            // Store session ID for future messages
            if (data.session_id) {
                this.sessions.set(user.uid, data.session_id);
            }
            
            return {
                text: data.text || 'No response received',
                success: data.success !== false,
                sessionId: data.session_id,
                sessionCreated: data.session_created || false
            };
        } catch (error) {
            console.error('Agent service error:', error);
            return {
                text: 'Sorry, I encountered an error processing your request.',
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start a new conversation (clear session)
     * @param {Object} user - Firebase user object
     */
    startNewConversation(user) {
        if (user?.uid) {
            this.sessions.delete(user.uid);
            console.log('Started new conversation for user:', user.uid);
        }
    }

    /**
     * Get current session ID for a user
     * @param {Object} user - Firebase user object
     * @returns {string|undefined} Current session ID
     */
    getCurrentSessionId(user) {
        return user?.uid ? this.sessions.get(user.uid) : undefined;
    }

    /**
     * Check agent health
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error', message: error.message };
        }
    }
}

// Export singleton instance
export const agentService = new AgentService();