// src/App.js
import { BrowserRouter as Router } from 'react-router-dom';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/routes';

const App = () => {
  return (
    <FirebaseAuthProvider>
      <Router>
        <div className="app">
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'dark:bg-gray-800',
              error: {
                duration: 5000,
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #ef4444',
                  padding: '16px',
                  borderRadius: '8px',
                },
              },
              success: {
                duration: 5000,
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #009E4A',
                  padding: '16px',
                  borderRadius: '8px',
                },
              }
            }}
          />
          <AppRoutes />
        </div>
      </Router>
    </FirebaseAuthProvider>
  );
};

export default App;