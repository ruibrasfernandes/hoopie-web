import React, { useEffect, useState, useRef } from 'react';
import { use } from 'react';

const VoiceModeComponent = ({
    text,
    response,
    onStop,
    isProcessing,
    isListening,
    isSpeaking,
    isUserSpeaking,
    onStopSpeaking,
    userVolume,
    hoopieVolume,
    playSound = true,
    isMicMuted: propsMicMuted = false,
    isVolumeMuted: propsVolumeMuted = false,
    toggleMicMute,
    toggleVolumeMute,
    voiceDownload,
    voicePreview,
    onOpenSettings,
    previewReportVoice
}) => {
    const responseWords = response ? response.split(' ') : [];
    const [userStartedTalking, setUserStartedTalking] = useState(false);
    const audioRef = useRef(null);
    const [audioError, setAudioError] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const textWordsRef = useRef([]); // Add this at the top with other refs/states

    useEffect(() => {
        textWordsRef.current = text ? text.split(' ') : [];
    }, [text]);

    useEffect(() => {

        console.log('🔊 Mic:', { propsMicMuted });
        console.log('🔊 Volume:', { propsVolumeMuted });

    }, [propsMicMuted, propsVolumeMuted]);

    // Initialize on mount
    useEffect(() => {
        if (!initialized) {
            console.log('Initializing component...');
            if (typeof toggleMicMute === 'function' && propsVolumeMuted == true) toggleMicMute(false);
            if (typeof toggleVolumeMute === 'function' && propsVolumeMuted == true) toggleVolumeMute(false);
            setInitialized(true);
        }
    }, []);

    // Handle mic mute
    const handleMicMute = () => {
        if (typeof toggleMicMute === 'function') toggleMicMute(!propsMicMuted);
    };

    // Handle volume mute
    const handleVolumeMute = () => {
        if (typeof toggleVolumeMute === 'function') toggleVolumeMute(!propsVolumeMuted);
    };

    useEffect(() => {
        if (playSound) {
            try {
                // Create audio element
                audioRef.current = new Audio('intro.mp3');

                // Add error handling
                audioRef.current.onerror = () => {
                    console.error("Error playing intro sound");
                    setAudioError(true);
                };

                // Play the sound
                audioRef.current.play().catch(error => {
                    console.error("Failed to play intro sound:", error);
                    setAudioError(true);
                });
            } catch (error) {
                console.error("Error setting up audio:", error);
                setAudioError(true);
            }
        }

        // Cleanup
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, [playSound]);

    useEffect(() => {
        if (isUserSpeaking && !userStartedTalking) {
            setUserStartedTalking(true);
            textWordsRef.current = [];
        } else if (isProcessing || isSpeaking) {
            setUserStartedTalking(false);
        }
    }, [isUserSpeaking, isProcessing]);

    useEffect(() => {
        // console.log('🔊 Volume User:', { userVolume });
        // console.log('🔊 Volume Hoopie:', { hoopieVolume });
    }, [userVolume, hoopieVolume]);

    const handlePreviewReport = (url) => {
        previewReportVoice(url);
    };

    return (
        <div className="voice-interaction">
            <div className="voice-interaction__listening-cue">
                <div for-state="userIsSpeaking">
                    <span>I'm listening</span>
                    <div className="voice-interaction__wave-icon">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                </div>
                <span for-state="idle">Initializing</span>
                <div for-state="userIsSpeaking">

                </div>
                <span for-state="error">
                    <i>warning</i>
                    <span>No microphone was found</span>
                </span>
            </div>

            <div className="voice-interaction__subtitles">
                {response && !isSpeaking && !isProcessing && (
                    <>
                        <div className="voice-interaction__hoopie-text">
                            <span className="static-text">{response}</span>
                        </div>
                        {(voiceDownload || voicePreview) && (
                            <div className="voice-interaction__actionables">
                                <div className="file-action-item">
                                    <span>Cyber Intel Report.zip</span>
                                    {voiceDownload && (
                                        <a href={voiceDownload} target="_blank" rel="noopener noreferrer">
                                            <i>download</i>
                                        </a>
                                    )}
                                    {voicePreview && (
                                        <button onClick={() => handlePreviewReport(voicePreview)}>
                                            <i>visibility</i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {userStartedTalking && !isSpeaking && !isProcessing ? (
                    // When user is speaking, animate the transcribed text
                    <div className="voice-interaction__user-text mt-2">
                        {textWordsRef.current.map((word, index) => (
                            <span key={index} className="word animated">
                                {word}&nbsp;
                            </span>
                        ))}
                    </div>
                ) : isSpeaking ? (
                    // When assistant is speaking, animate response but show static user text
                    <>
                        <div className="voice-interaction__user-text">
                            <span className="static-text">{text}</span>
                        </div>
                        <div className="voice-interaction__hoopie-text mt-2">
                            {responseWords.map((word, index) => (
                                <span key={index} className="word animated">
                                    {word}&nbsp;
                                </span>
                            ))}
                        </div>
                    </>
                ) : isProcessing ? (
                    // During processing, show static user text
                    <>
                        <div className="voice-interaction__user-text">
                            <span className="static-text">{text}</span>
                        </div>
                        <span className="voice-interaction__processing mt-2">Processing...</span>
                    </>
                ) : null}
            </div>

            <div className="voice-interaction__actions">
                {/* <button
                    onClick={handleMicMute}
                    className={`btn-s btn-ghost border-gray-dark btn-square ${propsMicMuted ? 'active' : ''}`}
                >
                    <i className="text-white">{propsMicMuted ? 'mic_off' : 'mic'}</i>
                </button> */}

                {(isSpeaking && !isProcessing) ? (
                    // <button onClick={() => onStopSpeaking()} className="btn-xs btn-ghost" disabled={isProcessing}>
                    //     <i className="fill">stop</i>
                    //     <span>Stop</span>
                    // </button>
                    <button onClick={() => onStopSpeaking()} className="btn-s btn-ghost border-gray-dark text-white btn-square">
                        <i className="fill text-brand-blue">stop</i>
                    </button>
                ) : (
                    null
                    // <button onClick={() => onStop()} className="btn-xs btn-ghost">
                    //     <i>clear</i>
                    //     <span>Close</span>
                    // </button>
                )}

                {/* <button
                    onClick={handleVolumeMute}
                    className={`btn-s btn-ghost border-gray-dark text-white btn-square ${propsVolumeMuted ? 'active' : ''}`}
                >
                    <i className="text-white">{propsVolumeMuted ? 'volume_off' : 'volume_up'}</i>
                </button> */}
            </div>
            <div className="voice-interaction__aux-actions">
                <button onClick={handleMicMute} className={`btn-s btn-ghost border-gray-dark btn-square ${propsMicMuted ? 'active' : ''}`}>
                    <i className="text-white">{propsMicMuted ? 'mic_off' : 'mic'}</i>
                </button>
                <button className="btn-s btn-ghost border-gray-dark btn-square" onClick={onOpenSettings}>
                    <i className="text-white">tune</i>
                </button>
                <button onClick={() => onStop()} className="btn-s btn-ghost border-gray-dark btn-square" disabled={isProcessing}>
                    <i className="text-white">clear</i>
                </button>
            </div>
        </div>
    );
};

export default VoiceModeComponent;