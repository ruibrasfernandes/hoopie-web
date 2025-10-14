import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Slider } from 'primereact/slider';
import { Tooltip } from 'primereact/tooltip';
import { Dropdown } from 'primereact/dropdown';
import { languageConfigs } from '../components/LanguageSelector';

const VoiceSettingsDialog = ({
    id,
    visible,
    onHide,
    noiseSuppressionLevel,
    silenceTimeout,
    selectedLanguage,
    onSave
}) => {
    // Local state for form values
    const [localNoiseSuppression, setLocalNoiseSuppression] = useState(noiseSuppressionLevel);
    const [localSilenceTimeout, setLocalSilenceTimeout] = useState(silenceTimeout);
    const [localLanguage, setLocalLanguage] = useState(selectedLanguage);

    const dialogRef = useRef(null);

    useEffect(() => {
        if (dialogRef.current) {
            const dialogContainer = dialogRef.current?.container;
            if (dialogContainer) {
                dialogContainer.id = id; // Set the id for the root container
            }
        }
    }, [id]);

    // Reset local state when dialog opens
    useEffect(() => {
        if (visible) {
            setLocalNoiseSuppression(noiseSuppressionLevel);
            setLocalSilenceTimeout(silenceTimeout);
            setLocalLanguage(selectedLanguage);
        }
    }, [visible, noiseSuppressionLevel, silenceTimeout, selectedLanguage]);

    const handleSave = () => {
        onSave({
            noiseSuppressionLevel: localNoiseSuppression,
            silenceTimeout: localSilenceTimeout,
            selectedLanguage: localLanguage
        });
        onHide();
    };

    const footer = (
        // <div className="flex justify-end gap-s">
        //     <button onClick={onHide} className="btn-xs btn-ghost">
        //         <span>Cancel</span>
        //     </button>
        //     <button onClick={handleSave} className="btn-xs btn-fill">
        //         <span>Apply Settings</span>
        //     </button>
        // </div>
        <div className="flex justify-center gap-s">
            <button onClick={onHide} className="btn-s btn-fill btn-square">
                <i>clear</i>
            </button>
            <button onClick={handleSave} className="btn-s btn-ghost btn-square">
                <i>check</i>
            </button>
        </div>
    );

    return (
        <Dialog
            header="Voice Settings"
            id={id}
            visible={visible}
            onHide={onHide}
            modal
            footer={footer}
        >
            <fieldset>
                <label className="text-s text-white">
                    {/* Noise Suppression Level: {localNoiseSuppression} Hz */}
                    {localNoiseSuppression}<small>Hz</small>
                </label>
                <Slider
                    value={localNoiseSuppression}
                    onChange={(e) => setLocalNoiseSuppression(e.value)}
                    min={500}
                    max={2000}
                    step={100}
                    orientation="vertical"
                    style={{ height: '100px' }}
                />
                {/* <small>
                    Adjust to reduce background noise (500-2000 Hz)
                </small> */}
                <i id="icon1">spatial_tracking</i>
                <Tooltip target="#icon1" content="Adjust to reduce background noise (500-2000 Hz)" position="left" />
            </fieldset>

            <fieldset>
                <label className="text-s text-white">
                    {/* Silence Timeout: {localSilenceTimeout / 1000} seconds */}
                    {localSilenceTimeout / 1000}<small>s</small>
                </label>
                <Slider
                    value={localSilenceTimeout}
                    onChange={(e) => setLocalSilenceTimeout(e.value)}
                    min={0}
                    max={10000}
                    step={1000}
                    orientation="vertical"
                    style={{ height: '100px' }}
                />
                {/* <small>
                    Time to wait after silence before processing (0-10 seconds)
                </small> */}
                <i id="icon2">hourglass_empty</i>
                <Tooltip target="#icon2" content="Time to wait after silence before processing. Helps when someone doesn't talk very fast (0-10 seconds)" position="left" />
            </fieldset>

            {/* <fieldset>
                <label className="text-xs text-brand-blue">Language</label>
                <Dropdown
                    value={localLanguage}
                    options={languageConfigs}
                    onChange={(e) => setLocalLanguage(e.value)}
                    optionLabel="name"
                    placeholder="Select Language"
                />
            </fieldset> */}
        </Dialog>
    );
};

export default VoiceSettingsDialog;