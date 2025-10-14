import { useEffect } from 'react';

const useScrollToBottomOnMessages = (messages) => {
    useEffect(() => {
        if (messages.length > 0) {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages]); // Dependency on messages ensures scrolling happens when messages change
};

export default useScrollToBottomOnMessages;