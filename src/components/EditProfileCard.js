import React, { useState, useEffect, useRef } from 'react';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '../config/firebase';

const EditProfileCard = ({ visible, onHide, onProfileUpdated }) => {
    const { user } = useFirebaseAuth();
    const [userData, setUserData] = useState(null);
    const [editedData, setEditedData] = useState({
        display_name: '',
        phone_number: '',
        nickname: '',
        language: 'PT',
        photo_url: ''
    });
    const [profilePictureUrl, setProfilePictureUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [originalFile, setOriginalFile] = useState(null); // Store original uncropped file
    const [selectedFilePreview, setSelectedFilePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
    const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
    const [imageScale, setImageScale] = useState(1);
    const [initialScale, setInitialScale] = useState(1);
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
    const [savedCropParams, setSavedCropParams] = useState(null); // Store crop params for re-editing

    const cameraInputRef = useRef(null);
    const uploadInputRef = useRef(null);
    const cropImageRef = useRef(null);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user || !visible) return;

            try {
                const db = getFirestore(app);
                const userDoc = doc(db, 'users', user.uid);
                const userSnapshot = await getDoc(userDoc);

                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    setUserData(data);

                    // Initialize edited data with existing values or empty strings
                    setEditedData({
                        display_name: data.display_name || '',
                        phone_number: data.phone_number || '',
                        nickname: data.nickname || '',
                        language: data.language || 'PT',
                        photo_url: data.photo_url || ''
                    });

                    // Fetch profile picture if exists
                    if (data.photo_url) {
                        try {
                            const storage = getStorage(app);
                            const imageRef = ref(storage, data.photo_url);
                            const downloadUrl = await getDownloadURL(imageRef);
                            setProfilePictureUrl(downloadUrl);
                        } catch (photoErr) {
                            console.error('Error loading profile picture:', photoErr);
                            // Photo doesn't exist, but that's okay
                            setProfilePictureUrl(null);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user data');
            }
        };

        fetchUserData();
    }, [user, visible]);

    const handleInputChange = (field, value) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePhotoUploadClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log('Upload button clicked');
        console.log('Upload input ref:', uploadInputRef.current);

        // Use setTimeout to ensure the DOM is ready
        setTimeout(() => {
            if (uploadInputRef.current) {
                console.log('Triggering click on upload input');
                uploadInputRef.current.value = ''; // Reset value to allow same file
                uploadInputRef.current.click();
            } else {
                console.error('Upload input ref still not available');
            }
        }, 0);
    };

    const handlePhotoCameraClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log('Camera button clicked');
        console.log('Camera input ref:', cameraInputRef.current);

        // Use setTimeout to ensure the DOM is ready
        setTimeout(() => {
            if (cameraInputRef.current) {
                console.log('Triggering click on camera input');
                cameraInputRef.current.value = ''; // Reset value to allow same file
                cameraInputRef.current.click();
            } else {
                console.error('Camera input ref still not available');
            }
        }, 0);
    };

    const handlePhotoChange = (e) => {
        console.log('Photo selected:', e.target.files);
        const file = e.target.files[0];
        if (file) {
            console.log('File details:', file.name, file.type, file.size);
            // Create preview URL for cropping
            const previewUrl = URL.createObjectURL(file);

            // Store original file
            setOriginalFile(file);

            // Load image to calculate initial scale and position
            const img = new Image();
            img.onload = () => {
                const circleSize = 250; // Match CSS .crop-preview size
                const imgAspectRatio = img.width / img.height;

                // Calculate initial scale to fit the smaller dimension to the circle
                let initialScale;
                if (imgAspectRatio > 1) {
                    // Landscape: fit height to circle
                    initialScale = circleSize / img.height;
                } else {
                    // Portrait or square: fit width to circle
                    initialScale = circleSize / img.width;
                }

                // With transformOrigin: 0 0, translate positions the top-left corner
                // To center the scaled image in the circle, we need to offset by half the scaled size
                const scaledWidth = img.width * initialScale;
                const scaledHeight = img.height * initialScale;
                // Position so the center of the scaled image is at the center of the circle
                const initialX = (circleSize - scaledWidth) / 2;
                const initialY = (circleSize - scaledHeight) / 2;

                setImageToCrop(previewUrl);
                setImageNaturalSize({ width: img.width, height: img.height });
                setShowCropModal(true);
                setCropPosition({ x: initialX, y: initialY });
                setInitialPosition({ x: initialX, y: initialY });
                setImageScale(initialScale);
                setInitialScale(initialScale);
                console.log('Opening crop modal with initial scale:', initialScale, 'natural size:', img.width, 'x', img.height);
            };
            img.src = previewUrl;
        }
    };

    const handleCropComplete = () => {
        if (!cropImageRef.current) return;

        // Create canvas for cropped image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const outputSize = 300; // Output square size
        canvas.width = outputSize;
        canvas.height = outputSize;

        const img = cropImageRef.current;
        const circleSize = 250; // Match CSS .crop-preview size

        // The image is displayed with CSS transform: translate(x, y) scale(s) and transformOrigin: 0 0
        // With transformOrigin 0 0, the translate(x, y) positions the image's TOP-LEFT corner at (x, y)
        // Then it scales from that top-left corner

        // Image natural dimensions
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        // cropPosition.x and cropPosition.y are where the image TOP-LEFT corner is positioned
        // After scaling from top-left, the image's top-left is still at cropPosition
        const imageLeft = cropPosition.x;
        const imageTop = cropPosition.y;

        // Circle viewport starts at (0, 0) with size circleSize x circleSize
        // Calculate which part of the SCALED image is visible in the circle viewport
        const visibleLeft = 0 - imageLeft;  // How far into the scaled image the circle starts (x)
        const visibleTop = 0 - imageTop;    // How far into the scaled image the circle starts (y)

        // Convert back to original image coordinates (before scaling)
        // sourceX, sourceY = which pixel in the original image corresponds to the circle's top-left
        // sourceWidth, sourceHeight = how many pixels in the original image fit in the circle
        const sourceX = visibleLeft / imageScale;
        const sourceY = visibleTop / imageScale;
        const sourceWidth = circleSize / imageScale;
        const sourceHeight = circleSize / imageScale;

        console.log('Crop calculation:', {
            cropPosition,
            imageScale,
            circleSize,
            naturalSize: { width: imgWidth, height: imgHeight },
            imageTopLeft: { x: imageLeft, y: imageTop },
            visibleInScaled: { left: visibleLeft, top: visibleTop },
            source: { x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight }
        });

        // Draw the cropped portion scaled to output size
        ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            outputSize,
            outputSize
        );

        // Convert to blob
        canvas.toBlob((blob) => {
            const croppedFile = new File([blob], originalFile.name, {
                type: originalFile.type,
                lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);
            setSelectedFilePreview(previewUrl);
            setSelectedFile(croppedFile);

            // Save crop parameters for re-editing
            setSavedCropParams({
                position: { ...cropPosition },
                scale: imageScale,
                initialScale: initialScale,
                initialPosition: { ...initialPosition }
            });

            setShowCropModal(false);
            setImageToCrop(null);
            console.log('Crop complete, preview updated');
        }, originalFile.type);
    };

    const handleCropCancel = () => {
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
        setShowCropModal(false);
        setImageToCrop(null);
        setSelectedFile(null);
        setCropPosition({ x: 0, y: 0 });
        setImageScale(1);
    };

    const handleMouseDown = (e) => {
        isDraggingRef.current = true;
        dragStartRef.current = {
            x: e.clientX - cropPosition.x,
            y: e.clientY - cropPosition.y
        };
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current) return;

        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;

        setCropPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    const handleTouchStart = (e) => {
        isDraggingRef.current = true;
        const touch = e.touches[0];
        dragStartRef.current = {
            x: touch.clientX - cropPosition.x,
            y: touch.clientY - cropPosition.y
        };
        e.preventDefault();
    };

    const handleTouchMove = (e) => {
        if (!isDraggingRef.current) return;

        const touch = e.touches[0];
        const newX = touch.clientX - dragStartRef.current.x;
        const newY = touch.clientY - dragStartRef.current.y;

        setCropPosition({ x: newX, y: newY });
        e.preventDefault();
    };

    const handleTouchEnd = () => {
        isDraggingRef.current = false;
    };

    const handleZoomChange = (e) => {
        const zoomMultiplier = parseFloat(e.target.value);
        const newScale = zoomMultiplier * initialScale;

        // Keep image centered when zooming
        // When at zoom=1 (initialScale), position should be initialPosition
        // As we zoom, adjust position to keep the center point stable
        const scaleDiff = newScale / imageScale;
        const circleSize = 250;
        const centerX = circleSize / 2;
        const centerY = circleSize / 2;

        // Calculate new position to maintain center
        const newX = centerX - (centerX - cropPosition.x) * scaleDiff;
        const newY = centerY - (centerY - cropPosition.y) * scaleDiff;

        setImageScale(newScale);
        setCropPosition({ x: newX, y: newY });
    };

    const handleEditPhoto = () => {
        if (originalFile && savedCropParams) {
            // Recreate preview URL from original file
            const previewUrl = URL.createObjectURL(originalFile);

            // Load image to get natural size
            const img = new Image();
            img.onload = () => {
                setImageToCrop(previewUrl);
                setImageNaturalSize({ width: img.width, height: img.height });

                // Restore saved crop parameters
                setCropPosition(savedCropParams.position);
                setImageScale(savedCropParams.scale);
                setInitialScale(savedCropParams.initialScale);
                setInitialPosition(savedCropParams.initialPosition);

                setShowCropModal(true);
            };
            img.src = previewUrl;
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const db = getFirestore(app);
            const storage = getStorage(app);
            const userDoc = doc(db, 'users', user.uid);

            let photoUrl = editedData.photo_url;

            // Upload photo if a new one was selected
            if (selectedFile && originalFile) {
                try {
                    console.log('Uploading photos to Firebase Storage...');

                    // Upload cropped image
                    const croppedRef = ref(storage, `users/${user.uid}/image`);
                    const croppedMetadata = {
                        contentType: selectedFile.type,
                        customMetadata: {
                            uploadedBy: user.uid,
                            uploadedAt: new Date().toISOString()
                        }
                    };
                    await uploadBytes(croppedRef, selectedFile, croppedMetadata);

                    // Upload original image
                    const originalRef = ref(storage, `users/${user.uid}/original_image`);
                    const originalMetadata = {
                        contentType: originalFile.type,
                        customMetadata: {
                            uploadedBy: user.uid,
                            uploadedAt: new Date().toISOString()
                        }
                    };
                    await uploadBytes(originalRef, originalFile, originalMetadata);

                    photoUrl = `users/${user.uid}/image`;
                    console.log('Photos uploaded successfully');
                } catch (uploadErr) {
                    console.error('Error uploading photo:', uploadErr);
                    throw new Error(`Photo upload failed: ${uploadErr.message}`);
                }
            }

            // Prepare update data - only include fields that should be updated
            const updateData = {
                display_name: editedData.display_name || '',
                phone_number: editedData.phone_number || '',
                nickname: editedData.nickname || '',
                language: editedData.language || 'PT',
                photo_url: photoUrl
            };

            console.log('Updating Firestore with:', updateData);

            // Update Firestore
            await updateDoc(userDoc, updateData);
            console.log('Profile updated successfully');

            // Clean up preview URL
            if (selectedFilePreview) {
                URL.revokeObjectURL(selectedFilePreview);
                setSelectedFilePreview(null);
            }

            // Reset selected file
            setSelectedFile(null);

            // Notify parent component
            if (onProfileUpdated) {
                onProfileUpdated();
            }

            onHide();
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(`Failed to update profile: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (userData) {
            setEditedData({
                display_name: userData.display_name || '',
                phone_number: userData.phone_number || '',
                nickname: userData.nickname || '',
                language: userData.language || 'PT',
                photo_url: userData.photo_url || ''
            });
        }
        setSelectedFile(null);
        if (selectedFilePreview) {
            URL.revokeObjectURL(selectedFilePreview);
            setSelectedFilePreview(null);
        }
        setError(null);
        onHide();
    };

    if (!visible || !userData) return null;

    const displayPhotoUrl = selectedFilePreview || profilePictureUrl || "profile-placeholder.jpg";

    // Format creation date if available
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={`edit-profile-card ${visible ? 'visible' : ''}`}>
            <div className="edit-profile-card-header">
                <h3>Edit Profile</h3>
                <button className="edit-profile-close" onClick={handleCancel}>
                    <i>close</i>
                </button>
            </div>

            {error && <div className="edit-profile-error">{error}</div>}

            <div className="edit-profile-content">
                {/* Profile Photo */}
                <div className="edit-profile-photo-section">
                    <div className="edit-profile-photo">
                        <img src={displayPhotoUrl} alt="Profile" />
                        {selectedFilePreview && (
                            <button
                                className="edit-photo-overlay"
                                onClick={handleEditPhoto}
                                title="Adjust photo"
                            >
                                <i>edit</i>
                            </button>
                        )}
                    </div>
                    <div className="edit-profile-email" style={{ fontSize: '0.85em', color: '#888', marginTop: '0px', textAlign: 'center' }}>
                        {user?.email || 'N/A'}
                    </div>
                    <div className="edit-profile-photo-buttons">
                        <button
                            type="button"
                            className="photo-btn"
                            onClick={handlePhotoCameraClick}
                            title="Take a photo (mobile only)"
                        >
                            <i>photo_camera</i>
                        </button>
                        <button
                            type="button"
                            className="photo-btn"
                            onClick={handlePhotoUploadClick}
                            title="Upload from device"
                        >
                            <i>upload</i>
                        </button>
                    </div>
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                    />
                    <input
                        ref={uploadInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Editable Fields */}
                <div className="edit-profile-field">
                    <label htmlFor="display_name">Display Name</label>
                    <input
                        id="display_name"
                        type="text"
                        value={editedData.display_name}
                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                        placeholder="Enter display name"
                    />
                </div>

                <div className="edit-profile-field">
                    <label htmlFor="phone_number">Phone Number</label>
                    <input
                        id="phone_number"
                        type="tel"
                        value={editedData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        placeholder="Enter phone number"
                    />
                </div>

                <div className="edit-profile-field">
                    <label htmlFor="nickname">Nickname</label>
                    <input
                        id="nickname"
                        type="text"
                        value={editedData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        placeholder="Enter nickname"
                    />
                </div>

                <div className="edit-profile-field">
                    <label htmlFor="language">Language</label>
                    <select
                        id="language"
                        value={editedData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                    >
                        <option value="PT">Portuguese (PT)</option>
                        <option value="EN">English (EN)</option>
                    </select>
                </div>

                {/* Read-only Fields */}
                <div className="edit-profile-readonly-section">
                    <div className="edit-profile-field readonly">
                        <label>Role</label>
                        <div className="readonly-value">{userData.role || 'N/A'}</div>
                    </div>

                    <div className="edit-profile-field readonly">
                        <label>Customers</label>
                        <div className="readonly-value">
                            {userData.customers && userData.customers.length > 0
                                ? userData.customers.join(', ')
                                : 'N/A'}
                        </div>
                    </div>

                    <div className="edit-profile-field readonly">
                        <label>Creation Date</label>
                        <div className="readonly-value">{formatDate(userData.creation_date)}</div>
                    </div>
                </div>
            </div>

            <div className="edit-profile-actions">
                <button
                    className="edit-profile-cancel"
                    onClick={handleCancel}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    className="edit-profile-save"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Crop Modal */}
            {showCropModal && imageToCrop && (
                <div className="crop-modal-overlay" onClick={handleCropCancel}>
                    <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Adjust Photo</h3>
                        <div className="crop-container">
                            <div
                                className="crop-preview"
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <img
                                    ref={cropImageRef}
                                    src={imageToCrop}
                                    alt="Crop preview"
                                    style={{
                                        transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${imageScale})`,
                                        transformOrigin: '0 0'
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onTouchStart={handleTouchStart}
                                    draggable={false}
                                />
                            </div>
                        </div>
                        <div className="crop-controls">
                            <label>
                                <span>Zoom</span>
                                <input
                                    type="range"
                                    min="0.8"
                                    max="2"
                                    step="0.05"
                                    value={imageScale / initialScale}
                                    onChange={handleZoomChange}
                                />
                            </label>
                        </div>
                        <div className="crop-actions">
                            <button onClick={handleCropCancel}>Cancel</button>
                            <button onClick={handleCropComplete}>Apply</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProfileCard;
