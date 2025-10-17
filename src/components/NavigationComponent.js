import VoiceSettingsDialog from '../dialog/VoiceSettingsDialog';
import KnowledgeFeederSettings from '../dialog/KnowledgeFeederSettings';
import React, { useState } from 'react';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import useProfilePicture from '../hooks/useProfilePicture';

const NavigationComponent = ({
    currentPage,
    actionButton,
    settings,         // Current settings
    onSaveSettings,    // Single save handler
    openWallboard,
    showWallboard,
}) => {
    const [settingsVisible, setSettingsVisible] = useState(false);

    const { logout } = useFirebaseAuth();
    const { profilePictureUrl } = useProfilePicture();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <>
            <nav className="home__secondary-nav">
                <nav>
                    {actionButton}
                </nav>

                <div className="profile">
                    <img src={profilePictureUrl || "profile-placeholder.jpg"} alt="Profile" />
                    <div className="profile__actions">
                        {/* <button onClick={() => setSettingsVisible(true)}>
                            <i>settings</i>
                        </button> */}
                        <button onClick={handleLogout}>
                            <i>logout</i>
                        </button>
                    </div>
                </div>
            </nav>

            <nav className="home__main-nav">
                {showWallboard && (
                    <button
                        className="nav-item"
                        onClick={() => openWallboard()}
                    >
                        {currentPage === 'home' ? 'Wallboard' : ''}

                    </button>
                )}


                <button
                    className="nav-item"
                    //onClick={() => navigate(currentPage === 'home' ? '/knowledge' : '/')}
                    onClick={() => window.location.href = 'http://10.123.89.21:3001'}
                >
                    {currentPage === 'home' ? 'Knowledge Feeder' : 'Chat'}
                </button>
            </nav>

            {currentPage === 'home' ? (
                <VoiceSettingsDialog
                    id="voice-settings"
                    visible={settingsVisible}
                    onHide={() => setSettingsVisible(false)}
                    noiseSuppressionLevel={settings.noiseSuppressionLevel}
                    silenceTimeout={settings.silenceTimeout}
                    selectedLanguage={settings.selectedLanguage}
                    onSave={(newSettings) => {
                        onSaveSettings(newSettings);
                        setSettingsVisible(false);
                    }}
                />
            ) : (
                <KnowledgeFeederSettings
                    visible={settingsVisible}
                    onHide={() => setSettingsVisible(false)}
                    autoSync={settings.autoSync}
                    defaultCategory={settings.defaultCategory}
                    displayMode={settings.displayMode}
                    onSave={(newSettings) => {
                        onSaveSettings(newSettings);
                        setSettingsVisible(false);
                    }}
                />
            )}
        </>
    );
};

export default NavigationComponent;