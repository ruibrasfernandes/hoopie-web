// src/routes/AppRoutes.js
import { Routes, Route, Navigate } from 'react-router-dom';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import KnowledgeFeeder from '../pages/KnowledgeFeeder';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useFirebaseAuth();
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useFirebaseAuth();
    
    // Only show loading on initial load, not on auth state changes
    if (loading && user === null) {
        return <div>Loading...</div>;
    }
    
    // Only redirect if user is actually authenticated
    if (user) {
        return <Navigate to="/" />;
    }
    
    // Always render children for non-authenticated users
    return children;
};

const AppRoutes = () => {

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <HomePage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/knowledge"
                element={
                    <PrivateRoute>
                        <KnowledgeFeeder />
                    </PrivateRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;