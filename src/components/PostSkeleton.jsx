export default function PostSkeleton() {
  return (
    <div className="post-card skeleton-card">
      <div style={{ display: "flex", gap: "12px" }}>
        <div className="skeleton skeleton-avatar" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton skeleton-line" style={{ width: "40%", height: "14px" }} />
          <div className="skeleton skeleton-line" style={{ width: "90%", height: "14px" }} />
          <div className="skeleton skeleton-line" style={{ width: "70%", height: "14px" }} />
          <div style={{ display: "flex", gap: "20px", marginTop: "4px" }}>
            <div className="skeleton skeleton-line" style={{ width: "40px", height: "12px" }} />
            <div className="skeleton skeleton-line" style={{ width: "40px", height: "12px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
