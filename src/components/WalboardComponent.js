import { useEffect, useRef, useState } from "react";

const DashboardComponent = ({ title, videosrc }) => {

    const videoRef = useRef(null);
    const [currentVideo, setCurrentVideo] = useState(videosrc);

    useEffect(() => {
        setCurrentVideo(videosrc);
        if (videoRef.current) {
            videoRef.current.play().catch(console.error);
        }
    }, [videosrc]);

    return (

        <div className="dashboard">
            <h2>{title}</h2>
            <video
                ref={videoRef}
                loop
                muted
                playsInline
                key={currentVideo}
            >
                <source src={currentVideo} type="video/webm" />
            </video>
            <h3>alert</h3>
        </div>
    );
}


const WallboardComponent = ({ onClose }) => {
    return (
        <div className="preview" type="tv">
            <button onClick={onClose} className="btn-s btn-fill btn-square">
                <i>clear</i>
            </button>
            <div className="screen">
                <div className="screen__content" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
                    <DashboardComponent title="Dashboard" videosrc="video1.webm" />
                    <DashboardComponent title="Dashboard" videosrc="video2.webm" />
                    <DashboardComponent title="Dashboard" videosrc="video3.webm" />
                    <DashboardComponent title="Dashboard" videosrc="video4.webm" />
                </div>
            </div>
        </div>
    );



}

export default WallboardComponent;