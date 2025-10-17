import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import app from '../config/firebase';

const useProfilePicture = () => {
    const [profilePictureUrl, setProfilePictureUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useFirebaseAuth();

    useEffect(() => {
        const fetchProfilePicture = async () => {
            if (!user) {
                setProfilePictureUrl(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Get Firestore instance
                const db = getFirestore(app);
                const userDoc = doc(db, 'users', user.uid);
                const userSnapshot = await getDoc(userDoc);

                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    const photoUrl = userData.photo_url;

                    if (photoUrl) {
                        // Get Firebase Storage instance
                        const storage = getStorage(app);
                        const imageRef = ref(storage, photoUrl);
                        const downloadUrl = await getDownloadURL(imageRef);
                        setProfilePictureUrl(downloadUrl);
                    } else {
                        setProfilePictureUrl(null);
                    }
                } else {
                    setProfilePictureUrl(null);
                }
            } catch (err) {
                console.error('Error fetching profile picture:', err);
                setError(err.message);
                setProfilePictureUrl(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProfilePicture();
    }, [user]);

    return { profilePictureUrl, loading, error };
};

export default useProfilePicture;
