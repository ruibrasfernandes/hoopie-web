import React, { useState, useEffect } from 'react';
import useLogin from '../hooks/useLogin';

const LoginPage = ({ onLoginSuccess }) => {
    const { formData, error, isLoading, handleInputChange, handleSubmit, handleGoogleSignIn } = useLogin();
    
    // Get environment from environment variable
    const environment = process.env.REACT_APP_ENVIRONMENT || 'dev';
    
    // Configure environment display settings
    const getEnvironmentConfig = () => {
        switch (environment) {
            case 'dev':
                return {
                    label: 'development',
                    color: 'green'
                };
            case 'stag':
                return {
                    label: 'staging',
                    color: 'orange'
                };
            case 'demo':
                return {
                    label: 'demo',
                    color: 'red'
                };
            case 'prod':
            default:
                return {
                    label: '',
                    color: 'green'
                };
        }
    };
    
    const envConfig = getEnvironmentConfig();
    
    // Local error state that persists across hook re-initializations
    const [displayError, setDisplayError] = useState('');
    
    // Check global window object for persistent error
    useEffect(() => {
        const checkError = () => {
            try {
                // Check window.loginError which persists across component remounts
                const globalError = window.loginError;
                if (globalError && globalError !== displayError) {
                    console.log('LoginPage: Found persistent error in window object, displaying:', globalError);
                    setDisplayError(globalError);
                }
            } catch (e) {
                console.warn('LoginPage: Failed to check window for error:', e);
            }
        };
        
        checkError();
        
        // Set up an interval to check for errors (in case of timing issues)
        const interval = setInterval(checkError, 100);
        
        return () => clearInterval(interval);
    }, [displayError]);
    
    // Clear display error when user starts typing
    const handleInputChangeWrapper = (e) => {
        if (displayError) {
            setDisplayError('');
            window.loginError = null; // Clear global error
            localStorage.removeItem('loginError'); // Clear localStorage too
            console.log('LoginPage: Cleared error because user started typing');
        }
        handleInputChange(e);
    };
    
    // Debug: Log what LoginPage is receiving
    console.log('LoginPage render:', { 
        formData, 
        error, 
        displayError,
        isLoading, 
        hasError: !!error,
        errorLength: error?.length 
    });

    return (
        <div className="login">
            <div className="login__bubbles">
                <div className="blue-bubble"></div>
                <div className="purple-bubble"></div>
                <div className="green-bubble"></div>
            </div>
            <div className="login__container">
                <div className="login__branding">
                    <img
                        src="hoopie-logo.png"
                        alt="Hoopie Logo"
                        className="login__logo"
                    />
                    <img
                        src="deloitte.png"
                        alt="Deloitte Logo"
                        className="login__logo-company"
                    />
                </div>

                <div className="login__form-container">
                    <h3 className="login__title">
                        Sign in <br />
                        <small 
                            className="login__subtitle" 
                            style={{ color: envConfig.color }}
                        >
                            {environment === 'prod' ? 'Hoopie' : (
                                <>
                                    Hoopie <strong>{envConfig.label}</strong>
                                </>
                            )}
                        </small>
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <fieldset className="complex-fieldset" disabled={isLoading}>
                            <label htmlFor="email">Email address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChangeWrapper}
                                placeholder="your.email@deloitte.pt"
                                required
                                autoComplete="email"
                            />
                            <i>person</i>
                        </fieldset>

                        <fieldset className="complex-fieldset" disabled={isLoading}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                placeholder="xxxxxxxx"
                                onChange={handleInputChangeWrapper}
                                required
                                autoComplete="current-password"
                            />
                            <i>lock</i>
                        </fieldset>

                        <div className="login__buttons mt-s">
                            <button
                                type="button"
                                className="btn-s btn-outline btn-arrow"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                            >
                                <span>🔥 Sign in with Google</span>
                            </button>
                            <button
                                type="submit"
                                className="btn-s btn-fill btn-arrow"
                                state={isLoading ? 'loading' : 'idle'}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span>Processing</span>
                                        <i className="rotating">autorenew</i>
                                    </>
                                ) : (
                                    <>
                                        <span>Login</span>
                                        <i>arrow_forward</i>
                                    </>
                                )}
                            </button>
                        </div>

                        {displayError && (
                            <div className="login__error-message" role="alert">
                                Please check again your login/password
                            </div>
                        )}

                        <p className="login__help-text">
                            If you don't have credentials or something is wrong with your
                            current email/password, reach out to <a href="mailto:xxx@deloitte.pt">xxx@deloitte.pt</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;