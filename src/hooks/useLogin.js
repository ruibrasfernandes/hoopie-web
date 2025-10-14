import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';

const useLogin = () => {
    const navigate = useNavigate();
    const firebaseAuth = useFirebaseAuth();

    // Initialize state from localStorage to persist across component remounts
    const [formData, setFormData] = useState(() => {
        try {
            const saved = localStorage.getItem('loginFormData');
            return saved ? JSON.parse(saved) : { email: '', password: '' };
        } catch {
            return { email: '', password: '' };
        }
    });
    
    const [error, setError] = useState(() => {
        try {
            const savedError = localStorage.getItem('loginError') || '';
            console.log('Initializing error from localStorage:', savedError);
            return savedError;
        } catch {
            console.log('Failed to load error from localStorage, using empty string');
            return '';
        }
    });
    
    // Force error state to be updated from localStorage on mount
    useEffect(() => {
        const checkForSavedError = () => {
            try {
                const savedError = localStorage.getItem('loginError');
                if (savedError && savedError !== error) {
                    console.log('Found saved error in localStorage, updating state:', savedError);
                    setError(savedError);
                }
            } catch (e) {
                console.warn('Failed to check localStorage for saved error:', e);
            }
        };
        
        checkForSavedError();
    }, [error]);
    
    const [isLoading, setIsLoading] = useState(false);
    
    // Persist form data to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('loginFormData', JSON.stringify(formData));
        } catch (e) {
            console.warn('Failed to save form data to localStorage:', e);
        }
    }, [formData]);
    
    // Track if this is the initial render
    const isInitialRender = useRef(true);
    
    // Persist error to localStorage
    useEffect(() => {
        try {
            if (error) {
                console.log('Saving error to localStorage:', error);
                localStorage.setItem('loginError', error);
            } else if (!isInitialRender.current) {
                // Only remove from localStorage if this isn't the initial render
                // This prevents clearing the error when component remounts
                console.log('Removing error from localStorage (not initial render)');
                localStorage.removeItem('loginError');
            } else {
                console.log('Skipping error removal on initial render');
            }
        } catch (e) {
            console.warn('Failed to save error to localStorage:', e);
        }
        
        // Mark that initial render is complete
        isInitialRender.current = false;
    }, [error]);
    
    // Prevent hook re-initialization by stabilizing Firebase context access
    const stableFirebaseAuth = useRef(firebaseAuth);
    stableFirebaseAuth.current = firebaseAuth;

    // Debug: Log when error state changes
    useEffect(() => {
        console.log('useLogin error state changed:', error);
    }, [error]);

    // Debug: Log when Firebase context state changes
    useEffect(() => {
        console.log('Firebase context state:', {
            user: !!firebaseAuth.user,
            loading: firebaseAuth.loading,
            error: firebaseAuth.error
        });
        
        // Only clear our local error if user successfully authenticates
        if (firebaseAuth.user && !firebaseAuth.loading) {
            console.log('User authenticated successfully, clearing local error');
            setError('');
            localStorage.removeItem('loginError'); // Also clear from localStorage
        }
        // Don't let Firebase context changes clear our local error state
        // We manage our own error state independently
    }, [firebaseAuth.user, firebaseAuth.loading]);

    // Debug: Log when form data changes
    useEffect(() => {
        console.log('Form data state changed:', formData);
        
        // If form data gets unexpectedly cleared, that's a bug
        if (!formData.email && !formData.password) {
            console.warn('Form data was cleared unexpectedly!');
        }
    }, [formData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log('Input changed:', name, value);
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };
            console.log('Form data updated to:', newData);
            return newData;
        });
        // Clear error when user starts typing
        if (error) {
            console.log('Clearing error because user is typing');
            setError('');
        }
    };

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('Login attempt started with:', { email: formData.email, hasPassword: !!formData.password });

        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('Calling Firebase signIn...');
            const result = await firebaseAuth.signIn(formData.email, formData.password);
            console.log('Firebase signIn successful:', result);
            
            // Clear persisted data on successful login
            localStorage.removeItem('loginFormData');
            localStorage.removeItem('loginError');
            
            navigate('/');
        } catch (err) {
            console.log('Firebase signIn error:', err);
            let errorMessage = 'An error occurred during login';

            if (err.code) {
                console.log('Error code:', err.code);
                switch (err.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                    case 'auth/invalid-login-credentials':
                        errorMessage = 'Invalid email or password';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'This account has been disabled';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed attempts. Please try again later';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your connection';
                        break;
                    default:
                        errorMessage = err.message || errorMessage;
                }
            }

            console.log('Setting error message:', errorMessage);
            setError(errorMessage);
            
            // Also store in global window object for persistence across remounts
            window.loginError = errorMessage;
            console.log('Stored error in window.loginError:', window.loginError);
            
            // Don't clear the form on error - keep the email and password
        } finally {
            setIsLoading(false);
            console.log('Login attempt completed, loading set to false');
            
            // Add a small delay to ensure error persists
            setTimeout(() => {
                console.log('Checking error state after timeout:', error);
            }, 100);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');

        try {
            await firebaseAuth.signInWithGoogle();
            
            // Clear persisted data on successful login
            localStorage.removeItem('loginFormData');
            localStorage.removeItem('loginError');
            
            navigate('/');
        } catch (err) {
            let errorMessage = 'Google sign-in failed';

            if (err.code) {
                switch (err.code) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = 'Sign-in was cancelled';
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = 'Popup was blocked. Please allow popups for this site';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your connection';
                        break;
                    default:
                        errorMessage = err.message || errorMessage;
                }
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        formData,
        error,
        isLoading,
        handleInputChange,
        handleSubmit,
        handleGoogleSignIn,
        isFirebaseLoading: firebaseAuth.loading,
        firebaseError: firebaseAuth.error
    };
};

export default useLogin;