import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useVoiceChat = (settings) => {
    const [isListening, setIsListening] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isError, setIsError] = useState(false);

    const [currentText, setCurrentText] = useState("");
    const [userVolume, setUserVolume] = useState(0);
    const [hoopieVolume, setHoopieVolume] = useState(0);

    // Voice services moved to GCP - clients to be implemented
    const transcribeClient = useRef(null);
    const pollyClient = useRef(null);
    const mediaStream = useRef(null);
    const audioContext = useRef(null);
    const currentAudio = useRef(null);
    const isProcessingRef = useRef(false);
    const volumeAnalyser = useRef(null);
    const volumeAnimationFrame = useRef(null);
    const currentTimeoutId = useRef(null); // New ref for tracking the timeout
    const abortController = useRef(null); // New ref for AbortController

    const pendingTimeoutsRef = useRef([]);

    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVolumeMuted, setIsVolumeMuted] = useState(false);
    const volumeMutedRef = useRef(false);

    const isStoppingRef = useRef(false);

    const [isMicReady, setIsMicReady] = useState(false);

    const isActuallyPlaying = useRef(false);

    const cleanup = useCallback(async () => {
        console.log("🧹 Starting comprehensive cleanup");

        // Set a cleanup in progress flag
        const cleanupInProgress = true;

        setIsMicMuted(false);
        setIsVolumeMuted(false);

        // 1. Abort all ongoing operations
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null;
        }

        // 2. Clear all pending timeouts
        pendingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        pendingTimeoutsRef.current = [];

        // 3. Stop any ongoing audio playback
        if (currentAudio.current) {
            currentAudio.current.pause();
            currentAudio.current.src = '';
            currentAudio.current = null;
        }

        // 4. Stop all media tracks with verification
        if (mediaStream.current) {
            const tracks = mediaStream.current.getTracks();
            await Promise.all(tracks.map(async track => {
                track.stop();
                track.enabled = false;
                // Wait a bit to ensure track is properly stopped
                await new Promise(resolve => setTimeout(resolve, 100));
            }));
            mediaStream.current = null;
        }

        // 5. Cancel any ongoing animations
        if (volumeAnimationFrame.current) {
            cancelAnimationFrame(volumeAnimationFrame.current);
            volumeAnimationFrame.current = null;
        }

        // 6. Clear any pending timeouts
        if (currentTimeoutId.current) {
            clearTimeout(currentTimeoutId.current);
            currentTimeoutId.current = null;
        }

        // 7. Close audio context with verification
        if (audioContext.current) {
            try {
                await audioContext.current.close();
                // Verify it's closed
                await new Promise(resolve => setTimeout(resolve, 100));
                if (audioContext.current.state !== 'closed') {
                    console.warn('AudioContext not properly closed, forcing null');
                }
            } catch (error) {
                console.error("Error closing audio context:", error);
            }
            audioContext.current = null;
        }

        // 8. Handle TranscribeClient cleanup with proper verification
        if (transcribeClient.current) {
            try {
                const wsState = await transcribeClient.current.config.requestHandler.getSocketInfo?.();
                if (wsState && wsState.readyState !== WebSocket.CLOSING && wsState.readyState !== WebSocket.CLOSED) {
                    await transcribeClient.current.destroy();
                    // Wait for WebSocket to fully close
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (error) {
                console.warn("WebSocket cleanup error:", error);
            }

            // Create new client only after ensuring old one is cleaned up
            await new Promise(resolve => setTimeout(resolve, 200));
            // TODO: Replace with GCP Speech-to-Text client
            transcribeClient.current = null;
        }

        // 9. Reset all states
        setIsListening(false);
        setIsSpeaking(false);
        setIsUserSpeaking(false);
        setIsProcessing(false);
        setCurrentText("");
        setUserVolume(0);
        setHoopieVolume(0);
        isProcessingRef.current = false;

        // 10. Reset the volume analyzer
        if (volumeAnalyser.current) {
            volumeAnalyser.current = null;
        }

        setIsMicReady(false);

        // Add a final delay to ensure all cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log("🧹 Cleanup completed");
    }, []);

    const handleVoiceStop = useCallback(async () => {
        console.log("🛑 Force stopping all voice processes");

        if (abortController.current) {
            abortController.current.abort();
        }

        await cleanup();
    }, [cleanup]);

    const updateHoopieVolume = useCallback(() => {
        if (!volumeAnalyser.current) {
            console.log("🔇 Volume analyser not initialized");
            return;
        }
        const array = new Uint8Array(volumeAnalyser.current.fftSize);
        volumeAnalyser.current.getByteTimeDomainData(array);

        const sumSquares = array.reduce((sum, value) => {
            const normalized = (value - 128) / 128; // Normalize to range -1 to 1
            return sum + normalized ** 2;
        }, 0);
        const rms = Math.sqrt(sumSquares / array.length);
        isActuallyPlaying.current = rms > 0.01;
        setHoopieVolume(rms * 100); // Scale RMS to 0-100        

        volumeAnimationFrame.current = requestAnimationFrame(updateHoopieVolume);
    }, []);

    const speak = useCallback(async (text) => {
        if (abortController.current?.signal.aborted) {
            throw new Error("Speaking aborted");
        }
        let url;
        let speakContext;

        try {
            // Reset error state when starting to speak
            setIsError(false);
            // Prevent duplicate audio playback
            if (currentAudio.current) {
                console.warn("🚫 Speak called while audio is already playing.");
                return;
            }

            setIsSpeaking(true);
            isProcessingRef.current = true;

            console.log("🗣 Starting speech synthesis for text:", text);

            // TODO: Replace with GCP Text-to-Speech client
            const response = null; 
            /* 
            await pollyClient.current.send(new SynthesizeSpeechCommand({
                Text: text,
                OutputFormat: "mp3",
                VoiceId: "Joanna",
                // VoiceId: "Amy", // UK
                // Add better audio quality settings
                SampleRate: "24000", // More stable sample rate
            }));
            */

            if (response && response.AudioStream instanceof ReadableStream) {
                console.log("🔊 Received audio stream from Polly");
                const reader = response.AudioStream.getReader();
                const chunks = [];

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                    }
                } catch (readError) {
                    console.error("Error reading stream:", readError);
                    throw readError;
                }

                const blob = new Blob(chunks, { type: "audio/mpeg" });
                url = URL.createObjectURL(blob);

                // Create audio element with explicit settings
                const audio = new Audio();
                audio.preload = "auto"; // Ensure audio is preloaded
                audio.muted = volumeMutedRef.current;

                // Wait for audio to be loaded before setting up AudioContext
                await new Promise((resolve, reject) => {
                    audio.addEventListener('loadeddata', resolve, { once: true });
                    audio.addEventListener('error', reject, { once: true });
                    audio.src = url;
                });

                try {
                    // Resume context immediately after creation to handle Mac's auto-suspension
                    speakContext = new (window.AudioContext || window.webkitAudioContext)();
                    await speakContext.resume();

                    const source = speakContext.createMediaElementSource(audio);
                    volumeAnalyser.current = speakContext.createAnalyser();

                    // Optimize analyzer settings for better performance
                    volumeAnalyser.current.fftSize = 1024; // Reduced from 2048 for better performance
                    volumeAnalyser.current.smoothingTimeConstant = 0.6; // Less smoothing for faster response

                    source.connect(volumeAnalyser.current);
                    volumeAnalyser.current.connect(speakContext.destination);

                    currentAudio.current = audio;

                    // Setup event handlers with proper cleanup
                    const onPlay = () => {
                        console.log("▶️ Audio playback started");
                        setIsSpeaking(true);
                        updateHoopieVolume();
                    };

                    const onEnded = async () => {
                        console.log("⏹ Audio playback ended");
                        // Cleanup in correct order
                        if (volumeAnimationFrame.current) {
                            cancelAnimationFrame(volumeAnimationFrame.current);
                            volumeAnimationFrame.current = null;
                        }

                        setIsSpeaking(false);
                        isProcessingRef.current = false;
                        setHoopieVolume(0);

                        // Clean up audio resources
                        audio.removeEventListener('play', onPlay);
                        audio.removeEventListener('ended', onEnded);

                        if (url) {
                            URL.revokeObjectURL(url);
                            url = null;
                        }

                        if (speakContext) {
                            await speakContext.close();
                            speakContext = null;
                        }

                        currentAudio.current = null;
                    };

                    audio.addEventListener('play', onPlay);
                    audio.addEventListener('ended', onEnded);

                    // Start playback with error handling
                    try {
                        await audio.play();
                    } catch (playError) {
                        console.error("Playback failed, retrying once:", playError);
                        // One retry attempt for Safari
                        await speakContext.resume();
                        await audio.play();
                    }
                } catch (audioContextError) {
                    console.error("AudioContext error:", audioContextError);
                    throw audioContextError;
                }
            }
        } catch (error) {
            console.error("Speech error:", error);
            toast.error("Speech error: " + error.message);

            // Comprehensive cleanup
            if (volumeAnimationFrame.current) {
                cancelAnimationFrame(volumeAnimationFrame.current);
                volumeAnimationFrame.current = null;
            }

            setIsSpeaking(false);
            isProcessingRef.current = false;
            setHoopieVolume(0);

            if (url) {
                URL.revokeObjectURL(url);
            }

            if (speakContext) {
                await speakContext.close().catch(console.error);
            }

            currentAudio.current = null;
        }
    }, [updateHoopieVolume]);

    const startRecording = useCallback(
        async (onTranscriptionComplete, noiseSuppressionLevel = 3000, finalTranscriptDelay = 2000) => {
            try {
                setIsError(false);

                // Only do basic reset of state
                setIsListening(true);
                setCurrentText("");
                setUserVolume(0);

                // Create new abort controller
                abortController.current = new AbortController();
                const signal = abortController.current.signal;

                // Initialize Audio Context
                audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
                const contextSampleRate = audioContext.current.sampleRate;
                console.log("🎵 AudioContext sample rate:", contextSampleRate);

                // Set up media stream
                mediaStream.current = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: contextSampleRate
                    }
                });

                setIsMicReady(true)

                // Check if aborted during setup
                if (signal.aborted) {
                    console.log("🛑 Recording aborted during setup");
                    cleanup();
                    return;
                }

                const audioChunks = [];
                let currentTranscript = "";
                let timeoutId = null;
                let lastProcessTime = Date.now();

                const processAudio = async function* () {
                    try {
                        const source = audioContext.current.createMediaStreamSource(mediaStream.current);
                        const highPassFilter = audioContext.current.createBiquadFilter();
                        highPassFilter.type = "highpass";
                        highPassFilter.frequency.value = noiseSuppressionLevel;

                        const lowPassFilter = audioContext.current.createBiquadFilter();
                        lowPassFilter.type = "lowpass";
                        lowPassFilter.frequency.value = 3500;

                        const bufferSize = 2048;
                        const processor = audioContext.current.createScriptProcessor(bufferSize, 1, 1);

                        source.connect(highPassFilter);
                        highPassFilter.connect(lowPassFilter);
                        lowPassFilter.connect(processor);
                        processor.connect(audioContext.current.destination);

                        processor.onaudioprocess = (event) => {
                            try {
                                if (isProcessingRef.current || currentAudio.current || isActuallyPlaying.current) {
                                    // Skip processing entirely when speaking/processing
                                    return;
                                }

                                if (signal.aborted) return;

                                const now = Date.now();
                                if (now - lastProcessTime < 20) return;
                                lastProcessTime = now;

                                if (isProcessingRef.current || currentAudio.current || isActuallyPlaying.current) {
                                    // Create silent audio chunk (all zeros)
                                    const silentChunk = new Int16Array(1024).fill(0);
                                    audioChunks.push(silentChunk.buffer);
                                    return;
                                }

                                const audioData = event.inputBuffer.getChannelData(0);
                                const chunkSize = 1024;

                                for (let i = 0; i < audioData.length; i += chunkSize) {
                                    if (signal.aborted) break;
                                    const chunk = audioData.slice(i, i + chunkSize);
                                    const processedData = new Int16Array(chunk.map(x => Math.max(-1, Math.min(1, x)) * 0x7fff));
                                    audioChunks.push(processedData.buffer);
                                }

                                let sumSquares = 0;
                                for (let i = 0; i < audioData.length; i++) {
                                    const val = audioData[i];
                                    if (!isNaN(val)) sumSquares += val * val;
                                }
                                const rms = Math.sqrt(sumSquares / audioData.length) || 0;

                                if (!signal.aborted) {
                                    setUserVolume(rms * 100);
                                    setIsUserSpeaking(rms > 0.01);

                                    if (rms > 0.01 && timeoutId) {
                                        clearTimeout(timeoutId);
                                        const index = pendingTimeoutsRef.current.indexOf(timeoutId);
                                        if (index > -1) {
                                            pendingTimeoutsRef.current.splice(index, 1);
                                        }
                                        timeoutId = null;
                                    }
                                }
                            } catch (error) {
                                console.error("Audio processing error:", error);
                            }
                        };

                        while (!signal.aborted) {
                            if (isProcessingRef.current || currentAudio.current || isActuallyPlaying.current) {
                                // Send empty/silent audio chunks while speaking to prevent timeout
                                const silentChunk = new Int16Array(1024).fill(0);
                                yield { AudioEvent: { AudioChunk: new Uint8Array(silentChunk.buffer) } };
                                await new Promise(resolve => setTimeout(resolve, 20));
                                continue;
                            }

                            if (audioChunks.length > 0) {
                                yield { AudioEvent: { AudioChunk: new Uint8Array(audioChunks.shift()) } };
                            }
                            await new Promise(resolve => setTimeout(resolve, 20));
                        }
                    } catch (error) {
                        if (!signal.aborted) {
                            console.error("Audio stream processing error:", error);
                            throw error;
                        }
                    }
                };

                // Start transcription
                const transcriptionStream = null;
                /* 
                await transcribeClient.current.send(
                    new StartStreamTranscriptionCommand({
                        LanguageCode: "en-US",
                        MediaEncoding: "pcm",
                        MediaSampleRateHertz: contextSampleRate,
                        AudioStream: processAudio(),
                        VocabularyName: "hoopie-vocabulary",
                    })
                );
                */

                // Process transcription results
                try {
                    for await (const event of transcriptionStream?.TranscriptResultStream || []) {
                        if (isProcessingRef.current || currentAudio.current || isActuallyPlaying.current) {
                            continue; // Skip processing entirely
                        }

                        if (signal.aborted) {
                            console.log("🛑 Transcription processing aborted");
                            break;
                        }

                        if (!event.TranscriptEvent?.Transcript?.Results?.[0]) continue;

                        const result = event.TranscriptEvent.Transcript.Results[0];
                        const transcript = result.Alternatives?.[0]?.Transcript;

                        if (!transcript) continue;

                        const formattedTranscript = transcript.trim();

                        if (isProcessingRef.current || currentAudio.current || isActuallyPlaying.current) {
                            console.log("🚫 Ignoring user input while processing/speaking");
                            continue;
                        }

                        if (result.IsPartial) {
                            setCurrentText(`${currentTranscript.trim()} ${formattedTranscript}`.trim());
                        } else {
                            currentTranscript = `${currentTranscript.trim()} ${formattedTranscript}`.trim();
                            setCurrentText(currentTranscript);
                        }

                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            const index = pendingTimeoutsRef.current.indexOf(timeoutId);
                            if (index > -1) {
                                pendingTimeoutsRef.current.splice(index, 1);
                            }
                        }

                        timeoutId = setTimeout(async () => {
                            // Simply check if aborted or not listening
                            if (signal.aborted) {
                                console.log("🛑 Transcript processing cancelled");
                                return;
                            }

                            if (!currentTranscript || currentAudio.current) {
                                console.log("🚫 Final transcript ignored");
                                return;
                            }

                            const finalizedTranscript = currentTranscript
                                .replace(/(^\w|\.\s*\w)/g, match => match.toUpperCase())
                                .replace(/\b(hopi|hope|hopie|hoopy|hopy|hoy|hoopee|oopie|opi)\b/gi, 'Hoopie')
                                .trim();

                            console.log("✅ Processing final transcript:", finalizedTranscript);
                            isProcessingRef.current = true;
                            setIsProcessing(true);

                            try {
                                await onTranscriptionComplete(finalizedTranscript);
                            } catch (error) {
                                console.error("Processing error:", error);
                            } finally {
                                if (!signal.aborted) {
                                    setIsProcessing(false);
                                    isProcessingRef.current = false;
                                }
                            }

                            currentTranscript = "";
                        }, finalTranscriptDelay);

                        pendingTimeoutsRef.current.push(timeoutId);
                    }
                } catch (error) {
                    if (!signal.aborted) {
                        console.error("Transcription stream error:", error);
                        // Check if it's a timeout error
                        if (error.name === "BadRequestException" && error.message.includes("timed out")) {
                            console.log("🕒 Transcription timed out due to silence - handling gracefully");
                            // Clean restart of recording
                            await cleanup();
                            setIsError(false);  // Don't show error state for timeout
                            if (!isStoppingRef.current) {  // Only restart if we're not intentionally stopping
                                startRecording(onTranscriptionComplete, noiseSuppressionLevel, finalTranscriptDelay);
                            }
                        } else {
                            throw error;  // Re-throw other errors
                        }
                    }
                }
            } catch (error) {
                if (!abortController.current?.signal.aborted) {
                    console.error("Recording error:", error);
                    if (error.name === "BadRequestException" && error.message.includes("timed out")) {
                        // Don't show error toast for timeout
                        setIsError(false);
                    } else {
                        setIsError(true);
                        if (error.name !== "BadRequestException") {
                            toast.error(`Recording error: ${error.message || error}`);
                        }
                    }
                }
            }
        },
        [cleanup, handleVoiceStop]
    );

    const stopSpeaking = useCallback(() => {
        console.log("🔇 Stopping audio playback");
        if (currentAudio.current) {
            currentAudio.current.pause();
            currentAudio.current = null;
            setIsSpeaking(false);
            isProcessingRef.current = false;
        }
    }, []);

    const toggleMicMute = useCallback(() => {
        if (mediaStream.current) {
            const audioTrack = mediaStream.current.getAudioTracks()[0];
            if (audioTrack) {
                setIsMicMuted(!isMicMuted);
                audioTrack.enabled = isMicMuted;
            }
        }
    }, [isMicMuted]);

    const toggleVolumeMute = useCallback((newState) => {
        setIsVolumeMuted(newState);
        volumeMutedRef.current = newState; // Update ref
        if (currentAudio.current) {
            currentAudio.current.muted = newState;
        }
    }, []);

    return {
        isListening,
        isSpeaking,
        isUserSpeaking,
        isProcessing,
        currentText,
        userVolume,
        hoopieVolume,
        startRecording,
        cleanup,
        speak,
        stopSpeaking,
        handleVoiceStop,
        isMicMuted,
        isVolumeMuted,
        toggleMicMute,
        toggleVolumeMute,
        isError,
        isMicReady,
    };
};