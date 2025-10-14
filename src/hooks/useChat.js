import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { agentService } from '../services/agentService';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';

// Message types
const MESSAGE_TYPES = {
    USER: 'user',
    ASSISTANT: 'assistant'
};


// Chat hook
export const useChat = () => {
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);


    const startNewConversation = useCallback(() => {
        console.log('🆕 Starting new conversation');
        if (user) {
            agentService.startNewConversation(user);
            setMessages([]);
            setCurrentSessionId(null);
            setError(null);
            console.log('✅ New conversation started');
        }
    }, [user]);


    const sendMessage = useCallback(async (input) => {
        if (!user) {
            toast.error('Please log in to send messages');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            // Add user message immediately
            setMessages(prev => [...prev, {
                type: MESSAGE_TYPES.USER,
                content: input,
                timestamp: new Date().toISOString()
            }]);

            console.log('🔵 Sending message to GCP agent:', input);
            const result = await agentService.sendMessage(input, user);

            // Update current session ID
            if (result.sessionId) {
                setCurrentSessionId(result.sessionId);
            }

            // Add assistant response
            if (result.text) {
                setMessages(prev => [...prev, {
                    type: MESSAGE_TYPES.ASSISTANT,
                    content: result.text,
                    timestamp: new Date().toISOString(),
                    success: result.success
                }]);
            }

            if (!result.success && result.error) {
                setError(result.error);
                toast.error(result.error);
            }

            console.log('✅ Message processed:', result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'Failed to send message';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initialize chat - placeholder method for compatibility
    const initializeChat = useCallback(async (force = false) => {
        console.log('🔧 Initialize chat called', { user: user?.uid, force });
        if (user) {
            // Placeholder - could perform health checks or initial setup
            try {
                // Optional: Check agent service health
                // await agentService.checkHealth();
                console.log('✅ Chat initialized for user:', user.uid);
                return true;
            } catch (error) {
                console.warn('⚠️ Chat initialization warning:', error);
                // Don't throw error - let chat work offline
                return false;
            }
        }
        return false;
    }, [user]);

    return {
        sendMessage,
        startNewConversation,
        initializeChat,
        loading,
        error,
        user,
        currentSessionId,
        inputText,
        setInputText,
        messages
    };
};