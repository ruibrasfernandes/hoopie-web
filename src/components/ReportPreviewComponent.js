const ReportPreviewComponent = ({ url, onClose }) => {
    if (!url) return null;

    return (
        <div className="preview">
            <button onClick={onClose} className="btn-s btn-fill btn-square">
                <i>clear</i>
            </button>
            <iframe
                src={url}
                title="HTML Preview"
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                }}
            />
        </div>
    );
};

export default ReportPreviewComponent;