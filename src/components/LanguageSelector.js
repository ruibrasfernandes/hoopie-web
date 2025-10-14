import React from 'react';
import { Dropdown } from 'primereact/dropdown';

// Language configurations
export const languageConfigs = [
    {
        code: "en-US",
        name: "English (US)",
        pollyVoice: "Joanna",
        transcribeCode: "en-US"
    },
    {
        code: "pt-PT",
        name: "Portuguese (PT)",
        pollyVoice: "Cristiano",
        transcribeCode: "pt-PT"
    },
    {
        code: "es-ES",
        name: "Spanish (ES)",
        pollyVoice: "Lucia",
        transcribeCode: "es-ES"
    },
    {
        code: "fr-FR",
        name: "French",
        pollyVoice: "Lea",
        transcribeCode: "fr-FR"
    },
    {
        code: "de-DE",
        name: "German",
        pollyVoice: "Vicki",
        transcribeCode: "de-DE"
    }
];

const LanguageSelector = ({
    selectedLanguage = languageConfigs[0],
    onLanguageChange
}) => {
    const handleChange = (event) => {
        onLanguageChange(event.value);
    };

    return (
        <div className="language-selector">
            <Dropdown
                value={selectedLanguage}
                options={languageConfigs}
                onChange={handleChange}
                optionLabel="name"
                placeholder="Select Language"
                className="language-dropdown"
            />
        </div>
    );
};

export { LanguageSelector };