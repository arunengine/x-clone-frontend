import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, showToast } from "../../components/Toast";
import PostSkeleton from "../../components/PostSkeleton";
import Navbar from "../../components/Navbar";
import { timeAgo } from "../../utils/timeAgo";
import {
  Home as HomeIcon, User as UserIcon, LogOut, MessageCircle,
  Heart, Trash2, CornerDownRight, UserPlus, Bell, Image, Search, X
} from "lucide-react";

// Base URL for API — set VITE_API_BASE in .env for production
const API = import.meta.env.VITE_API_BASE || "";
const MAX_CHARS = 280;

export default function Home() {
  // ─── State ────────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // New post form
  const [text, setText] = useState("");
  const [imgFile, setImgFile] = useState(null);     // base64 image string
  const [imgPreview, setImgPreview] = useState(null);
  const [posting, setPosting] = useState(false);

  // Comments
  const [commentText, setCommentText] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null); // which post's comments are open
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Current logged-in user info
  const [myUserId, setMyUserId] = useState(null);
  const [myUsername, setMyUsername] = useState("");

  // Right sidebar
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // ─── On page load ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Check if user is logged in
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(userData => {
        setMyUserId(userData._id);
        setMyUsername(userData.username);
      })
      .catch(() => navigate("/login")); // Not logged in — redirect

    fetchPosts();
    fetchSuggested();
    fetchUnread();
  }, [navigate]);

  // Close search dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search users after user stops typing (300ms debounce)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/users/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
        if (res.ok) setSearchResults(await res.json());
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300);
    return () => clearTimeout(timer); // Cancel timer if user keeps typing
  }, [searchQuery]);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  // Load posts for the feed
  const fetchPosts = async (silent = false) => {
    if (!silent) setLoadingPosts(true);
    try {
      const res = await fetch(`${API}/api/posts/all`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : (data.posts || []));
      }
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      if (!silent) setLoadingPosts(false);
    }
  };

  // Load suggested users for the sidebar
  const fetchSuggested = async () => {
    try {
      const res = await fetch(`${API}/api/users/suggested`, { credentials: "include" });
      if (res.ok) setSuggestedUsers(await res.json());
    } catch (err) {
      console.error("Fetch suggested error:", err);
    }
  };

  // Load unread notification count for the sidebar badge
  const fetchUnread = async () => {
    try {
      const res = await fetch(`${API}/api/notifications/`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // Convert selected image file to base64 so it can be sent as JSON
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImgFile(reader.result);
      setImgPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit a new post
  const handlePost = async () => {
    if (!text && !imgFile) return;
    if (text.length > MAX_CHARS) { showToast("Post too long!", "error"); return; }
    setPosting(true);
    try {
      const res = await fetch(`${API}/api/posts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, img: imgFile }),
      });
      if (res.ok) {
        setText("");
        setImgFile(null);
        setImgPreview(null);
        showToast("Post published!");
        fetchPosts(true); // Reload posts without showing loading spinner
      } else {
        const d = await res.json();
        showToast(d.err || "Failed to post", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setPosting(false);
    }
  };

  // Like or unlike a post
  const handleLikePost = async (postId) => {
    try {
      const res = await fetch(`${API}/api/posts/like/${postId}`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        const d = await res.json();
        showToast(d.message?.includes("unlike") ? "Unliked" : "❤️ Liked!");
        fetchPosts(true);
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // Delete a post (only shown for your own posts)
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`${API}/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        showToast("Post deleted");
        fetchPosts(true);
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to delete post", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  // Follow or unfollow a suggested user
  const handleFollowSuggested = async (userId) => {
    try {
      const res = await fetch(`${API}/api/users/follow/${userId}`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        const d = await res.json();
        showToast(d.message === "unfollowed" ? "Unfollowed" : "Following!");
        fetchSuggested();
        fetchPosts(true);
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  // Post a comment on a post
  const handleComment = async (e, postId) => {
    e.preventDefault();
    if (!commentText) return;
    try {
      const res = await fetch(`${API}/api/posts/comment/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: commentText }),
      });
      if (res.ok) {
        setCommentText("");
        showToast("Reply posted!");
        fetchPosts(true);
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  // Post a reply to a comment (nested reply)
  const handleNestedReply = async (e, postId, parentCommentId, replyToUsername) => {
    e.preventDefault();
    if (!replyText) return;
    try {
      const res = await fetch(`${API}/api/posts/comment/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: replyText, parentId: parentCommentId, replyToUsername }),
      });
      if (res.ok) {
        setReplyText("");
        setActiveReplyCommentId(null);
        showToast("Reply posted!");
        fetchPosts(true);
      }
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  // Log the user out
  const handleLogout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
    navigate("/login");
  };

  // Return avatar URL — fallback to generated avatar if no profile image
  const getAvatarUrl = (user) => {
    if (user?.profileImg?.trim()) return user.profileImg;
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || "default"}`;
  };

  // ─── Sub-components ───────────────────────────────────────────────────────

  // SVG ring showing how many characters have been typed
  const CharRing = ({ count, max }) => {
    const pct = Math.min(count / max, 1);
    const r = 10, circ = 2 * Math.PI * r;
    const dash = circ * pct;
    const color = count > max ? "#f4212e" : count > max * 0.8 ? "#ffd400" : "#1d9bf0";
    if (count === 0) return null;
    return (
      <svg className="char-counter-ring" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--border-color)" strokeWidth="2.5" />
        <circle cx="12" cy="12" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 12 12)" style={{ transition: "stroke-dasharray 0.2s, stroke 0.2s" }} />
        {count > max * 0.8 && (
          <text x="12" y="16" textAnchor="middle" fontSize="7" fill={color} fontWeight="700">
            {max - count}
          </text>
        )}
      </svg>
    );
  };

  // Renders the comment thread for a single post
  const renderCommentsSection = (post) => {
    const rootComments = post.comments.filter(c => !c.parentId);
    return (
      <div className="comments-list">
        {/* Add a new comment */}
        <form onSubmit={(e) => handleComment(e, post._id)} className="comment-form">
          <input
            autoFocus
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            type="text"
            placeholder="Post your reply..."
            className="comment-input"
          />
          <button type="submit" disabled={!commentText} className="btn-primary" style={{ padding: "8px 18px" }}>
            Reply
          </button>
        </form>

        {/* List of top-level comments */}
        {rootComments.map(comment => {
          const replies = post.comments.filter(r => r.parentId === comment._id);
          return (
            <div key={comment._id} className="comment-wrapper">
              <div className="comment-item">
                <Link to={`/profile/${comment.user.username}`} className="comment-avatar"
                  style={{ backgroundImage: `url(${getAvatarUrl(comment.user)})`, width: "36px", height: "36px" }} />
                <div className="comment-body">
                  <div>
                    <Link to={`/profile/${comment.user.username}`} className="post-author" style={{ fontWeight: "700" }}>
                      {comment.user.fullname}
                    </Link>
                    <span style={{ color: "var(--text-secondary)", fontSize: "13px", marginLeft: "6px" }}>
                      @{comment.user.username}
                    </span>
                    {comment.createdAt && (
                      <span style={{ color: "var(--text-secondary)", fontSize: "12px", marginLeft: "8px" }}>
                        · {timeAgo(comment.createdAt)}
                      </span>
                    )}
                  </div>
                  <p style={{ marginTop: "2px", fontSize: "14px" }}>{comment.text}</p>
                  <div className="comment-actions">
                    <button
                      onClick={() => {
                        setActiveReplyCommentId(activeReplyCommentId === comment._id ? null : comment._id);
                        setReplyText("");
                      }}
                      className="comment-action-btn"
                    >
                      <CornerDownRight size={13} /> Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline reply input */}
              {activeReplyCommentId === comment._id && (
                <form
                  onSubmit={(e) => handleNestedReply(e, post._id, comment._id, comment.user.username)}
                  className="reply-form-inline"
                >
                  <input
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    type="text"
                    placeholder={`Reply to @${comment.user.username}...`}
                    className="reply-input-inline"
                  />
                  <button type="submit" disabled={!replyText} className="btn-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>
                    Reply
                  </button>
                </form>
              )}

              {/* Nested replies under this comment */}
              {replies.length > 0 && (
                <div className="nested-replies">
                  {replies.map(reply => (
                    <div key={reply._id} className="nested-comment-item">
                      <Link to={`/profile/${reply.user.username}`} className="nested-comment-avatar"
                        style={{ backgroundImage: `url(${getAvatarUrl(reply.user)})` }} />
                      <div className="comment-body">
                        <div>
                          <Link to={`/profile/${reply.user.username}`} className="post-author" style={{ fontWeight: "700" }}>
                            {reply.user.fullname}
                          </Link>
                          <span style={{ color: "var(--text-secondary)", fontSize: "12px", marginLeft: "6px" }}>
                            @{reply.user.username}
                          </span>
                        </div>
                        <p style={{ marginTop: "2px", fontSize: "13px" }}>
                          <span style={{ color: "var(--accent-color)", marginRight: "4px" }}>@{reply.replyToUsername}</span>
                          {reply.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="layout">
      {/* Responsive Navigation (Sidebar on Desktop, Top & Bottom Nav on Mobile) */}
      <Navbar
        currentTab="home"
        myUsername={myUsername}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />

      {/* Center Feed */}
      <div className="main-content">
        <div className="main-header"><h3>Home</h3></div>

        {/* Create Post Box */}
        <div className="create-post-container">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What is happening?!"
            className="create-post-textarea"
            style={{ borderColor: text.length > MAX_CHARS ? "var(--error-color)" : undefined }}
          />

          {/* Image preview before posting */}
          {imgPreview && (
            <div className="image-preview-container">
              <img src={imgPreview} alt="preview" className="image-preview" />
              <button className="image-remove-btn" onClick={() => { setImgFile(null); setImgPreview(null); }}>
                <X size={14} />
              </button>
            </div>
          )}

          <div className="create-post-footer">
            <div className="create-post-toolbar">
              {/* Hidden file input triggered by the image button */}
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageChange} />
              <button className="toolbar-icon-btn" onClick={() => fileInputRef.current?.click()} title="Add image">
                <Image size={20} />
              </button>
              <CharRing count={text.length} max={MAX_CHARS} />
              {text.length > MAX_CHARS && (
                <span style={{ fontSize: "12px", color: "var(--error-color)" }}>{text.length - MAX_CHARS} over limit</span>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={handlePost}
              disabled={(!text && !imgFile) || text.length > MAX_CHARS || posting}
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>

        {/* Feed — loading, empty, or list of posts */}
        {loadingPosts ? (
          [1, 2, 3].map(i => <PostSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <p style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>No posts yet. Say something!</p>
        ) : (
          posts.map(post => (
            <div key={post._id} className="post-card">
              <div style={{ display: "flex", gap: "12px" }}>
                <Link to={`/profile/${post.user.username}`} className="post-avatar"
                  style={{ backgroundImage: `url(${getAvatarUrl(post.user)})` }} />
                <div style={{ width: "100%" }}>
                  <div className="post-header" style={{ justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "baseline", flexWrap: "wrap" }}>
                      <Link to={`/profile/${post.user.username}`} className="post-author">{post.user.fullname}</Link>
                      <Link to={`/profile/${post.user.username}`} className="post-username">@{post.user.username}</Link>
                      <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>· {timeAgo(post.createdAt)}</span>
                    </div>
                    {/* Delete button — only show for your own posts */}
                    {myUserId === post.user._id && (
                      <button onClick={() => handleDeletePost(post._id)} className="delete-post-btn" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {post.text && <p className="post-text">{post.text}</p>}
                  {post.img && <img src={post.img} alt="post" className="post-image" />}

                  {/* Like and comment buttons */}
                  <div className="interaction-bar">
                    <div
                      onClick={() => setActiveCommentPost(activeCommentPost === post._id ? null : post._id)}
                      className="interaction-icon"
                    >
                      <MessageCircle size={17} /> {post.comments.length}
                    </div>
                    <div
                      onClick={() => handleLikePost(post._id)}
                      className={`interaction-icon ${post.likes.includes(myUserId) ? "liked" : ""}`}
                    >
                      <Heart size={17} fill={post.likes.includes(myUserId) ? "currentColor" : "none"} /> {post.likes.length}
                    </div>
                  </div>

                  {/* Show comments section if this post is active */}
                  {activeCommentPost === post._id && renderCommentsSection(post)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        {/* Search box */}
        <div className="suggested-card" style={{ padding: "14px" }}>
          <div className="search-container" ref={searchRef}>
            <Search size={16} className="search-icon-abs" />
            <input
              className="search-input"
              placeholder="Search people"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
            />
            {/* Dropdown search results */}
            {searchOpen && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(user => (
                  <div
                    key={user._id}
                    className="search-result-item"
                    onClick={() => { setSearchQuery(""); setSearchOpen(false); navigate(`/profile/${user.username}`); }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundImage: `url(${getAvatarUrl(user)})`, backgroundSize: "cover", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px" }}>{user.fullname}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>@{user.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Who to follow suggestions */}
        {suggestedUsers.length > 0 && (
          <div className="suggested-card">
            <h4>Who to follow</h4>
            <div className="suggested-list">
              {suggestedUsers.map(user => (
                <div key={user._id} className="suggested-item">
                  <div className="suggested-user-info">
                    <Link to={`/profile/${user.username}`} className="suggested-avatar"
                      style={{ backgroundImage: `url(${getAvatarUrl(user)})` }} />
                    <div className="suggested-user-details">
                      <Link to={`/profile/${user.username}`} className="suggested-fullname">{user.fullname}</Link>
                      <Link to={`/profile/${user.username}`} className="suggested-username">@{user.username}</Link>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFollowSuggested(user._id)}
                    className="btn-primary"
                    style={{ padding: "6px 14px", fontSize: "13px", fontWeight: "700" }}
                  >
                    <UserPlus size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} /> Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
