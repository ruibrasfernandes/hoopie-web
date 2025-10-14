import React, { useState } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dropdown } from 'primereact/dropdown';
import toast from 'react-hot-toast';
import NavigationComponent from '../components/NavigationComponent';
import HeaderComponent from '../components/HeaderComponent';

const KnowledgeFeederPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('Cyber Ops, Neuro Connected Ops');
    const [selectedView, setSelectedView] = useState('Library');
    const [searchQuery, setSearchQuery] = useState('');
    const [knowledgeItems, setKnowledgeItems] = useState([
        { id: 1, filename: 'Filename.md', category: 'Cyber Ops', dateAdded: '2024/10/05' },
        { id: 2, filename: 'Filename.md', category: 'Cyber Ops', dateAdded: '2024/10/05' },
        { id: 3, filename: 'Filename.md', category: 'Cyber Ops', dateAdded: '2024/10/05' },
        { id: 4, filename: 'Filename.md', category: 'Cyber Ops', dateAdded: '2024/10/05' },
        { id: 5, filename: 'Filename.md', category: 'Cyber Ops', dateAdded: '2024/10/05' },
        { id: 6, filename: 'Filename.md', category: 'Cyber Ops', dateAdded: '2024/10/05' },
        { id: 7, filename: 'Filename.md', category: 'Cyber Ops', dateAdded: '2024/10/05' },
    ]);

    const handleDeleteItem = (id) => {
        confirmDialog({
            message: 'Are you sure you want to delete this item?',
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                setKnowledgeItems(prev => prev.filter(item => item.id !== id));
                toast.success('Item deleted successfully');
            }
        });
    };

    const addKnowledgeButton = (
        <button
            className="btn-xs btn-fill"
            onClick={() => handleAddKnowledge()}
        >
            <i>add</i>
            <span>Add Knowledge</span>
        </button>
    );

    const handleAddKnowledge = () => {
        toast.success('Feature coming soon!');
    };

    const [knowledgeSettings, setKnowledgeSettings] = useState({
        autoSync: false,
        defaultCategory: 'Cyber Ops',
        displayMode: 'grid'
    });

    const handleSaveSettings = (newSettings) => {
        setKnowledgeSettings(newSettings);
        console.log('🔧 Settings saved:', newSettings)
    };

    return (
        <div className="home">

            <HeaderComponent />

            <NavigationComponent
                currentPage="knowledge"
                actionButton={addKnowledgeButton}
                settings={knowledgeSettings}
                onSaveSettings={handleSaveSettings}
            />

            <main className="knowledge">

                <div className="knowledge__controls">
                    <div className="knowledge__filters">
                        <div className="filter-group">
                            <span className="filter-label">Category</span>
                            <Dropdown
                                value={selectedCategory}
                                options={['Cyber Ops, Neuro Connected Ops']}
                                onChange={(e) => setSelectedCategory(e.value)}
                                className="filter-dropdown"
                            />
                        </div>

                        <div className="filter-group">
                            <span className="filter-label">Viewing</span>
                            <Dropdown
                                value={selectedView}
                                options={['Library']}
                                onChange={(e) => setSelectedView(e.value)}
                                className="filter-dropdown"
                            />
                        </div>
                    </div>

                    <div className="knowledge__search">
                        <i>search</i>
                        <input
                            type="text"
                            placeholder="Type to search knowledge..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="knowledge__list">
                    <div className="knowledge__header">
                        <div className="knowledge__column">File name</div>
                        <div className="knowledge__column">Category</div>
                        <div className="knowledge__column">Date added</div>
                        <div className="knowledge__column">Actions</div>
                    </div>

                    {knowledgeItems.map((item) => (
                        <div key={item.id} className="knowledge__item">
                            <div className="knowledge__column">{item.filename}</div>
                            <div className="knowledge__column">{item.category}</div>
                            <div className="knowledge__column">{item.dateAdded}</div>
                            <div className="knowledge__column knowledge__actions">
                                <button
                                    className="action-button"
                                    onClick={() => toast.success('Viewing ' + item.filename)}
                                >
                                    <i>visibility</i>
                                </button>
                                <button
                                    className="action-button action-button--delete"
                                    onClick={() => handleDeleteItem(item.id)}
                                >
                                    <i>delete</i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <ConfirmDialog />
        </div>
    );

    // return <PollyGenerator awsConfig={awsConfig} />;
};

export default KnowledgeFeederPage;