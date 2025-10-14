import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';

const KnowledgeFeederSettings = ({
    visible,
    onHide,
    autoSync,
    defaultCategory,
    displayMode,
    onSave
}) => {
    // Local state for form values
    const [localAutoSync, setLocalAutoSync] = useState(autoSync);
    const [localDefaultCategory, setLocalDefaultCategory] = useState(defaultCategory);
    const [localDisplayMode, setLocalDisplayMode] = useState(displayMode);

    // Reset local state when dialog opens
    useEffect(() => {
        if (visible) {
            setLocalAutoSync(autoSync);
            setLocalDefaultCategory(defaultCategory);
            setLocalDisplayMode(displayMode);
        }
    }, [visible, autoSync, defaultCategory, displayMode]);

    const displayModes = [
        { label: 'Grid View', value: 'grid' },
        { label: 'List View', value: 'list' }
    ];

    const categories = [
        'Cyber Ops',
        'Neuro Connected Ops',
        'Network Performance'
    ];

    const handleSave = () => {
        onSave({
            autoSync: localAutoSync,
            defaultCategory: localDefaultCategory,
            displayMode: localDisplayMode
        });
        onHide();
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <button
                onClick={onHide}
                className="btn-xs btn-ghost"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="btn-xs btn-fill"
            >
                Apply
            </button>
        </div>
    );

    return (
        <Dialog
            header="Knowledge Base Settings"
            visible={visible}
            onHide={onHide}
            modal
            className="p-fluid"
            style={{ width: '450px' }}
            footer={footer}
            breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        >
            <div className="grid">
                <div className="col-12">
                    <div className="mb-4">
                        <div className="flex align-items-center justify-content-between">
                            <label className="font-bold">Auto Sync</label>
                            <InputSwitch
                                checked={localAutoSync}
                                onChange={(e) => setLocalAutoSync(e.value)}
                            />
                        </div>
                        <small className="text-gray-500 block mt-1">
                            Automatically sync knowledge base changes
                        </small>
                    </div>

                    <div className="mb-4">
                        <label className="font-bold block mb-2">Default Category</label>
                        <Dropdown
                            value={localDefaultCategory}
                            options={categories}
                            onChange={(e) => setLocalDefaultCategory(e.value)}
                            placeholder="Select Default Category"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="font-bold block mb-2">Display Mode</label>
                        <Dropdown
                            value={localDisplayMode}
                            options={displayModes}
                            onChange={(e) => setLocalDisplayMode(e.value)}
                            optionLabel="label"
                            placeholder="Select Display Mode"
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default KnowledgeFeederSettings;