import { Dropdown } from 'primereact/dropdown';
import 'primereact/resources/themes/lara-dark-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useEffect, useState, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import VoiceModeComponent from '../components/VoiceModeComponent';
import { useVoiceChat } from '../hooks/useVoiceChat';
import useScrollToBottomOnMessages from '../hooks/useScrollToBottomOnMessages';
import { gsap } from "gsap";
import toast from 'react-hot-toast';
import HeaderComponent from '../components/HeaderComponent';
import NavigationComponent from '../components/NavigationComponent';
import { animateBubble } from '../services/utils';
import { languageConfigs } from '../components/LanguageSelector';
import ReportPreviewComponent from '../components/ReportPreviewComponent';
import WallboardComponent from '../components/WalboardComponent';
import VoiceSettingsDialog from '../dialog/VoiceSettingsDialog';
import { Tooltip } from 'primereact/tooltip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useProfilePicture from '../hooks/useProfilePicture';

const HomePage = () => {

    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [voiceResponse, setVoiceResponse] = useState("");

    const [voicePreview, setVoicePreview] = useState(null);
    const [voiceDownload, setVoiceDownload] = useState(null);

    const voice = useVoiceChat();
    const [selectedProfile, setSelectedProfile] = useState(promptProfiles[0].name);
    const [quickPrompts, setQuickPrompts] = useState(promptsByProfile["Neuro Connected Ops"]);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
    const hoopieBubbleScaleRef = useRef(null);
    const userVoiceBubbleScaleLEFTRef = useRef(null);
    const userVoiceBubbleScaleRIGHTRef = useRef(null);
    const turbulenceRef = useRef(null); // Ref for <feTurbulence>
    const lastUpdateRef = useRef(0); // Track the last update time
    const [userStartedTalking, setUserStartedTalking] = useState(false);
    const [delayedListening, setDelayedListening] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const VOICE_MODE_TIMEOUT = 5000;

    const [wallboardPreview, setWallboardPreview] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);

    const [voiceSettings, setVoiceSettings] = useState({
        noiseSuppressionLevel: 2000,
        silenceTimeout: 500,
        selectedLanguage: languageConfigs[0]
    });

    const handleSaveSettings = (newSettings) => {
        setVoiceSettings(newSettings);
        setSettingsVisible(false);
        console.log('🔊 Voice settings saved:', newSettings)
    };

    const [hasMicPermissions, setHasMicPermissions] = useState(null); // null = unknown, true = granted, false = denied

    const { profilePictureUrl } = useProfilePicture();

    // Add this near other useEffects
    useEffect(() => {
        // Request mic permissions on load
        const requestMicPermissions = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Clean up the stream since we don't need it yet
                stream.getTracks().forEach(track => track.stop());
                setHasMicPermissions(true);
            } catch (error) {
                toast.error('Voice Mode disabled: Microphone permissions denied, cannot use voice mode');
                setHasMicPermissions(false);
            }
        };

        requestMicPermissions();
    }, []);

    useEffect(() => {
        let timeoutId;

        if (isVoiceMode && voice.isListening && !voice.isProcessing) {
            // Start the delay timer when voice mode is active and we're listening
            timeoutId = setTimeout(() => {
                setDelayedListening(true);
            }, 1000);
        } else {
            // Reset the delayed listening state when conditions change
            setDelayedListening(false);
        }

        // Cleanup function
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isVoiceMode, voice.isListening, voice.isProcessing]);

    useEffect(() => {
        if (voice.isUserSpeaking && !userStartedTalking) {
            setUserStartedTalking(true);
        } else if (voice.isProcessing || voice.isSpeaking) {
            setUserStartedTalking(false);
        }
    }, [voice.isUserSpeaking, voice.isProcessing]);

    const {
        initializeChat,
        sendMessage,
        loading,
        messages,
        inputText,
        setInputText,
        addHistoryToMessages,

    } = useChat();

    useScrollToBottomOnMessages(messages);

    useEffect(() => {

        if (voice.isUserSpeaking && !voice.isProcessing && !voice.isSpeaking) {
            animateBubble(userVoiceBubbleScaleLEFTRef, turbulenceRef, "0,162,221", isVoiceMode, voice.userVolume * 4); // R Bubble
            animateBubble(userVoiceBubbleScaleRIGHTRef, turbulenceRef, "20,52,120", isVoiceMode, voice.userVolume * 4); // L Bubble
        } else if (!voice.isUserSpeaking) {
            animateBubble(userVoiceBubbleScaleLEFTRef, turbulenceRef, "0,162,221", isVoiceMode, 0); // L Bubble
            animateBubble(userVoiceBubbleScaleRIGHTRef, turbulenceRef, "20,52,120", isVoiceMode, 0); // R Bubble
        }

    }, [voice.userVolume])

    useEffect(() => {

        if (voice.isProcessing) {
            animateBubble(hoopieBubbleScaleRef, null, "0,158,74", isVoiceMode, 0); // Hoopie Bubble
            animateBubble(userVoiceBubbleScaleLEFTRef, turbulenceRef, "0,162,221", isVoiceMode, 0); // R Bubble
            animateBubble(userVoiceBubbleScaleRIGHTRef, turbulenceRef, "20,52,120", isVoiceMode, 0); // L Bubble
        }

    }, [voice.isProcessing])

    useEffect(() => {
        if (voice.isSpeaking && !voice.isProcessing && !voice.isUserSpeaking) {
            animateBubble(hoopieBubbleScaleRef, null, "0,158,74", isVoiceMode, voice.hoopieVolume); // Hoopie Bubble
        } else if (!voice.isUserSpeaking) {
            animateBubble(hoopieBubbleScaleRef, null, "0,158,74", isVoiceMode, 0); // Hoopie Bubble
        }
        // console.log('🗣️ Hoopie speaking:' + voice.isSpeaking + "with volume: " + voice.hoopieVolume);

    }, [voice.hoopieVolume])

    useEffect(() => {
        if (isVoiceMode && voice.isListening && !voice.isProcessing && !voice.isUserSpeaking && !voice.isSpeaking) {
            // Clear any existing timeout when entering voice mode
            const timeout = setTimeout(() => {
                console.log("⏲️ Exiting voice mode due to inactivity");
                handleVoiceStop();
            }, 30 * VOICE_MODE_TIMEOUT); // 1 minutes

            // Cleanup function: clear timeout when dependencies change
            return () => {
                clearTimeout(timeout);
            };
        }
    }, [isVoiceMode, voice.isListening, voice.isProcessing, voice.isUserSpeaking, voice.isSpeaking]);


    useEffect(() => {
        if (shouldScrollToBottom) {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth',
            });
            setShouldScrollToBottom(false); // Reset the trigger
        }
    }, [shouldScrollToBottom]);

    useEffect(() => {
        initializeChat().catch(err => {
            toast.error('Failed to initialize chat:' + err);
        });
    }, []);

    // // AMPLITUDE SIMULATION
    // useEffect(() => {
    //     let animationFrameId;
    //     let time = 0;

    //     const simulateAmplitude = () => {
    //         // Create a sinusoidal pattern for amplitude (smooth wave pattern)
    //         const simulatedAmplitude = 0.5 + 0.5 * Math.sin(time); // Values range from 0 to 1
    //         setAmplitude(simulatedAmplitude);

    //         time += 0.05; // Adjust the speed of the wave
    //         animationFrameId = requestAnimationFrame(simulateAmplitude);
    //     };

    //     simulateAmplitude();

    //     return () => {
    //         cancelAnimationFrame(animationFrameId); // Cleanup on unmount
    //     };
    // }, []);
    // /AMPLITUDE SIMULATION

    // useEffect(() => {
    //     const now = performance.now(); // Get current timestamp
    //     // Update only if enough time has passed since the last update
    //     if (now - lastUpdateRef.current > 50) {
    //         lastUpdateRef.current = now; // Update the last update time

    //         if (hoopieBubbleScaleRef.current && isVoiceMode == true) {
    //             // setAmplitude(voice.hoopieVolume);
    //             // Scale the element based on amplitude (map it between 0.8 and 1.1)
    //             const scaleValue = 0.75 + amplitude * 0.35; // Amplitude maps between 0.8 and 1.1
    //             gsap.to(hoopieBubbleScaleRef.current, {
    //                 scale: scaleValue,
    //                 duration: 0.1,
    //                 ease: "none",
    //                 overwrite: true
    //             });

    //             // Update the displacement map scale based on amplitude
    //             // Map amplitude (0 to 1) to baseFrequency (0 to 0.006)
    //             const minBaseFrequency = 0;
    //             const maxBaseFrequency = 0.03;
    //             const newBaseFrequency = minBaseFrequency + amplitude * (maxBaseFrequency - minBaseFrequency);
    //             if (turbulenceRef.current) {
    //                 turbulenceRef.current.setAttribute('baseFrequency', newBaseFrequency + " 0");

    //                 // Reapply filter to target element
    //                 const targetElement = document.querySelector('#green-bubble');
    //                 if (targetElement) {
    //                     targetElement.style.filter = 'none'; // Temporarily remove the filter
    //                     requestAnimationFrame(() => {
    //                         targetElement.style.filter = 'url(#warpFilter)';
    //                     });
    //                 }
    //                 console.log('Updated baseFrequency:', newBaseFrequency);
    //             }
    //         }
    //     }
    // }, [amplitude]);

    useEffect(() => {
        const bubblesContainer = document.querySelector('.home__bubbles-container');
        const bubbles = document.querySelector('.home__bubbles');

        // Infinite rotation animation
        const rotateTimeline = gsap.timeline({ repeat: -1, paused: true })
            .to(bubbles, {
                rotation: 315,
                duration: 100,
                ease: "linear",
            });

        // Start the infinite animation initially
        rotateTimeline.play();

        // Handle voice mode transition
        if (isVoiceMode) {
            // Smoothly stop rotation and reset to 0
            rotateTimeline.pause();
            gsap.to(bubbles, {
                rotation: 0,
                duration: 0.5,
                ease: "power4.out",
            });
            gsap.to(bubblesContainer, {
                scale: 0.3,
                y: "-5vh",
                duration: 0.5,
                ease: "power4.out",
            });
        } else {
            gsap.to(bubblesContainer, {
                scale: 1,
                y: "-20vh",
                duration: 0.5,
                ease: "power4.out",
            });
            // Resume the infinite rotation when exiting voice mode
            rotateTimeline.play();
        }

        // Cleanup on unmount
        return () => {
            rotateTimeline.kill();
        };
    }, [isVoiceMode]);

    const handleProfileChange = (event) => {
        const newProfile = event.value;
        setSelectedProfile(newProfile);
        setQuickPrompts(promptsByProfile[newProfile]);
    };

    const handleMicClick = async () => {
        setIsVoiceMode(true);
        setDelayedListening(false);
        await voice.startRecording(async (transcript) => {

            // if (transcript.toLowerCase().trim() === 'stop' || transcript.toLowerCase().trim() === 'stop.') {
            //     return;
            // }

            try {
                const result = await sendMessage(transcript);
                setVoicePreview(result.has_preview);
                setVoiceDownload(result.has_download);
                if (result?.assistant_response) {
                    setVoiceResponse(result.assistant_response);
                    await voice.speak(result.assistant_response);
                }
            } catch (error) {
                toast.error('Failed to process voice message:' + error);
            }
        }, voiceSettings.noiseSuppressionLevel, voiceSettings.silanceTimeout);
    };

    const handleVoiceStop = async () => {
        try {
            setIsVoiceMode(false);  // UI state changes immediately
            await voice.handleVoiceStop();  // Cleanup starts
            setVoiceResponse("");
            addHistoryToMessages();
            setShouldScrollToBottom(true);
        } catch (error) {
            console.error("Error during voice stop:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        try {
            setInputText('');
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth', // Optional: makes the scrolling smooth
            });
            await sendMessage(inputText);
        } catch (err) {
            toast.error('Failed to send message:' + err);
        }
    };

    const handlePromptClick = async (promptText) => {
        try {
            console.log('📝 Sending prompt:', promptText);
            await sendMessage(promptText);
        } catch (err) {
            toast.error('Failed to send prompt:' + err);
        }
    };

    const handleStopSpeaking = () => {
        voice.stopSpeaking();
    };

    const handleNewChat = () => {
        initializeChat(true)
    }

    const previewReport = async (url) => {
        setPreviewUrl(url);
    };

    const handleClosePreview = () => {
        setPreviewUrl("");
    }

    const handleCloseWallboard = () => {
        setWallboardPreview(false);
    }


    const newChatButton = messages.length !== 0 ? (
        <button className="btn-xs btn-fill" onClick={() => handleNewChat()}>
            <i>add_comment</i><span>New Chat</span>
        </button>
    ) : null;

    return (
        <div className="home"
            state={
                isVoiceMode && voice.isError ? 'error' :
                    isVoiceMode && !voice.isMicReady ? 'idle' :
                        voice.isProcessing ? 'processing' :
                            isVoiceMode && voice.isSpeaking ? 'hoopieIsSpeaking' :
                                isVoiceMode && voice.isUserSpeaking ? 'userIsSpeaking' :
                                    isVoiceMode && !delayedListening ? 'idle' :  // Add this condition
                                        isVoiceMode ? 'userIsSpeaking' :
                                            'idle'
            }
            mode={
                isVoiceMode ? 'voice' :
                    messages.length > 0 ? 'chat' :
                        'idle'
            }
            preview-state={(previewUrl || wallboardPreview) ? 'open' : 'closed'}>
            <>
                <div className="home__bubbles-container">
                    <div className="home__bubbles">
                        <div className="blue-bubble"><div><div ref={userVoiceBubbleScaleLEFTRef}></div></div></div>
                        <div className="purple-bubble"><div><div ref={userVoiceBubbleScaleRIGHTRef}></div></div></div>
                        <div className="green-bubble"><div><div ref={hoopieBubbleScaleRef}></div></div></div>
                    </div>
                </div>

                <HeaderComponent />

                <NavigationComponent
                    currentPage="home"
                    actionButton={newChatButton}
                    settings={voiceSettings}
                    onSaveSettings={handleSaveSettings}
                    openWallboard={() => setWallboardPreview(true)}  // Single save handler
                    showWallboard={!isVoiceMode || messages.length > 0}
                />

                {isVoiceMode ? (
                    <>
                        <VoiceModeComponent
                            text={voice.currentText}
                            response={voiceResponse}
                            onStop={handleVoiceStop}
                            isProcessing={voice.isProcessing}
                            isListening={voice.isListening}
                            isSpeaking={voice.isSpeaking}
                            isUserSpeaking={voice.isUserSpeaking}
                            onStopSpeaking={handleStopSpeaking}
                            userVolume={voice.userVolume}
                            hoopieVolume={voice.hoopieVolume}
                            playSound={messages.length === 0 && voice.isMicReady}
                            isMicMuted={voice.isMicMuted}
                            toggleMicMute={voice.toggleMicMute}
                            isVolumeMuted={voice.isVolumeMuted}
                            toggleVolumeMute={voice.toggleVolumeMute}
                            voiceDownload={voiceDownload}
                            voicePreview={voicePreview}
                            onOpenSettings={() => setSettingsVisible(true)}
                            previewReportVoice={previewReport}
                        />
                        <VoiceSettingsDialog
                            id="voice-settings"
                            visible={settingsVisible}
                            onHide={() => setSettingsVisible(false)}
                            noiseSuppressionLevel={voiceSettings.noiseSuppressionLevel}
                            silenceTimeout={voiceSettings.silenceTimeout}
                            selectedLanguage={voiceSettings.selectedLanguage}
                            onSave={handleSaveSettings}
                        />
                        {previewUrl && <ReportPreviewComponent url={previewUrl} onClose={handleClosePreview} />}
                        {wallboardPreview && <WallboardComponent onClose={handleCloseWallboard} />}
                        {/* <div className="slider-container">
                            <label htmlFor="noise-suppression-slider">Noise Suppression Level: {noiseSuppressionLevel} Hz</label>
                            <input
                                id="noise-suppression-slider"
                                type="range"
                                min="500"
                                max="2000"
                                step="100"
                                value={noiseSuppressionLevel}
                                onChange={(e) => setNoiseSuppressionLevel(Number(e.target.value))}
                            />
                            <label htmlFor="silance-timeout-slider">Silence Timeout: {silanceTimeout} sec</label>
                            <input
                                id="silance-timeout-slider"
                                type="range"
                                min="0"
                                max="10000"
                                step="1000"
                                value={silanceTimeout}
                                onChange={(e) => setSilanceTimeout(Number(e.target.value))}
                            />
                                        <LanguageSelector 
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
            />
                        </div> */}
                    </>
                ) : (
                    <>
                        <main className="home__main">
                            {messages.length === 0 ? (
                                <>
                                    <div className="home__welcome">
                                        <h1 className="home__title" >Hello, I'm Hoopie</h1>
                                        <h2 className="home__subtitle">How can I help?</h2>
                                    </div>

                                    <div className="home__quick-prompts">
                                        <div className="home__prompts-header">
                                            <span>Quick prompts profile: </span>
                                            <Dropdown
                                                value={selectedProfile}
                                                options={promptProfiles.map(profile => profile.name)} // Simplified options
                                                onChange={handleProfileChange}
                                                placeholder="Select a profile"
                                                className="profile-dropdown"
                                            />
                                        </div>
                                        <div className="home__prompts-grid">
                                            {quickPrompts && quickPrompts.map((prompt) => (
                                                <button
                                                    key={prompt.id}
                                                    className="home__prompt-card"
                                                    onClick={() => handlePromptClick(prompt.text)}
                                                >
                                                    {prompt.text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="messages">
                                    {messages.map((message, index) => {
                                        return (
                                            <div
                                                key={index}
                                                className={`message ${message.type === 'user' ? 'message__user' : 'message__hoopie'} ${message.history ? 'history' : ''}`}
                                            >
                                                <div className="message__content">
                                                    {/* Render message content with Markdown support */}
                                                    <div className="message__text">
                                                        {message.type === 'assistant' ? (
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || ''}</ReactMarkdown>
                                                        ) : (
                                                            <span>{message.content || ''}</span>
                                                        )}
                                                    </div>

                                                    {message.type === 'assistant' && (message.hasDownload || message.hasPreview) && (
                                                        <div className="flex-row gap-xs mt-s">
                                                            {(message.hasDownload || message.hasPreview) && (
                                                                <div className="file-action-item">
                                                                    <span>Cyber Intel Report.zip</span>
                                                                    {message.hasDownload && (
                                                                        <a href={message.hasDownload} target="_blank" rel="noopener noreferrer">
                                                                            <i>download</i>
                                                                        </a>
                                                                    )}
                                                                    {message.hasPreview && (
                                                                        <button onClick={() => previewReport(message.hasPreview)}>
                                                                            <i>visibility</i>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Profile Section */}
                                                <div className="message__profile">
                                                    {message.type === 'user' ? (
                                                        <img src={profilePictureUrl || "profile-placeholder.jpg"} alt="Profile" />
                                                    ) : (
                                                        <div className="hoopie-profile"></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {loading && (
                                        <div className="hoopie-message-loading">
                                            <div className="blue-bubble"></div>
                                            <div className="purple-bubble"></div>
                                            <div className="green-bubble"></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </main>

                        {previewUrl && <ReportPreviewComponent url={previewUrl} onClose={handleClosePreview} />}

                        {wallboardPreview && <WallboardComponent onClose={handleCloseWallboard} />}

                        <div id="chat-input-container">
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Type to chat with Hoopie"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button id="mic-button" className="btn" disabled={hasMicPermissions === false} onClick={handleMicClick}>
                                    <i id="mic">mic</i>
                                </button>
                                {!hasMicPermissions && <Tooltip target="#mic" content="Voice mode is disabled because no microphone was found. Please connect a microphone and allow it's use on your browser" position="top" />}
                            </div>
                        </div>
                    </>
                )}

                <svg style={{ display: 'none' }}>
                    <filter id="warpFilter" x="-50%" y="-50%" width="200%" height="200%" overflow="visible">
                        <feTurbulence ref={turbulenceRef} type="turbulence" baseFrequency="0 0" numOctaves="8" result="turbulence" />
                        <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="20" yChannelSelector="G" />
                    </filter>
                </svg>
            </>
        </div>
    );
};

export default HomePage;

const promptProfiles = [
    { id: 1, name: "Neuro Connected Ops" },
    { id: 2, name: "Network Performance" },
    { id: 3, name: "Customer Experience" },
    { id: 4, name: "Security Operations" }
];

const promptsByProfile = {
    "Neuro Connected Ops": [
        { id: 1, text: "What are the main mobile network alarms in Barcelona area today?" },
        { id: 2, text: "How many network trouble tickets were opened yesterday?" },
        { id: 3, text: "Show me the average resolution time for high-priority tickets this month" },
        { id: 4, text: "What's the current network performance in the downtown area?" }
    ],
    "Network Performance": [
        { id: 1, text: "Show me the network KPIs for the last 24 hours" },
        { id: 2, text: "What's the current network capacity utilization?" },
        { id: 3, text: "Compare network performance between different regions" },
        { id: 4, text: "Show me areas with poor signal strength" }
    ],
    "Customer Experience": [
        { id: 1, text: "What's the current customer satisfaction score?" },
        { id: 2, text: "Show me the most common customer complaints" },
        { id: 3, text: "What's the average response time to customer tickets?" },
        { id: 4, text: "List areas with highest customer churn" }
    ],
    "Security Operations": [
        { id: 1, text: "Show me recent security incidents" },
        { id: 2, text: "What are the current security alerts?" },
        { id: 3, text: "List failed login attempts in the last hour" },
        { id: 4, text: "Show me the security compliance status" }
    ]
};