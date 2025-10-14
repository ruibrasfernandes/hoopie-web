import React, { useState, useCallback } from 'react';
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import toast from 'react-hot-toast';

const PollyGenerator = ({ awsConfig }) => {
    const [text, setText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const pollyClient = new PollyClient(awsConfig);

    const generateSpeech = useCallback(async () => {
        if (!text.trim()) {
            toast.error("Please enter some text");
            return;
        }

        setIsGenerating(true);

        try {
            const response = await pollyClient.send(new SynthesizeSpeechCommand({
                Text: text,
                OutputFormat: "mp3",
                VoiceId: "Joanna",
                LanguageCode: "en-US",
                Engine: "neural",
                SampleRate: "24000"
            }));

            if (response.AudioStream instanceof ReadableStream) {
                const reader = response.AudioStream.getReader();
                const chunks = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }

                const blob = new Blob(chunks, { type: "audio/mpeg" });
                const url = URL.createObjectURL(blob);

                // Create download link
                const a = document.createElement('a');
                a.href = url;
                a.download = `polly-speech-${Date.now()}.mp3`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast.success("MP3 generated successfully!");
            }
        } catch (error) {
            console.error("Generation error:", error);
            toast.error("Failed to generate speech: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    }, [text, pollyClient]);

    return (
        <div className="flex flex-col gap-4 p-4">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to convert to speech..."
                className="w-full h-32 p-2 border rounded"
            />

            <button
                onClick={generateSpeech}
                disabled={isGenerating || !text.trim()}
                className={`px-4 py-2 rounded ${isGenerating || !text.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
            >
                {isGenerating ? "Generating..." : "Generate MP3"}
            </button>
        </div>
    );
};

export default PollyGenerator;