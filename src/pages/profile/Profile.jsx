import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ToastContainer, showToast } from "../../components/Toast";
import PostSkeleton from "../../components/PostSkeleton";
import Navbar from "../../components/Navbar";
import { timeAgo } from "../../utils/timeAgo";
import {
  Home as HomeIcon, User as UserIcon, LogOut, MessageCircle,
  Heart, Trash2, CornerDownRight, UserPlus, Bell, Edit2
} from "lucide-react";

// Base URL for API — set VITE_API_BASE in .env for production
const API = import.meta.env.VITE_API_BASE || "";

export default function Profile() {
  const { username } = useParams();  // Get the :username from the URL
  const navigate = useNavigate();

  // ─── State ────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);       // The profile user's data
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Current logged-in user info
  const [myUserId, setMyUserId] = useState(null);
  const [myUsername, setMyUsername] = useState("");
  const [myFollowing, setMyFollowing] = useState([]);  // IDs of users I follow

  const [activeTab, setActiveTab] = useState("posts"); // "posts" or "likes"
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Followers / Following modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("followers"); // "followers" or "following"

  // Edit Profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullname: "", bio: "", username: "" });
  const [saving, setSaving] = useState(false);

  // Comments
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");

  // ─── On page load ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Check if user is logged in
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(userData => {
        setMyUserId(userData._id);
        setMyUsername(userData.username);
        setMyFollowing(userData.following || []);
      })
      .catch(() => navigate("/login"));

    fetchSuggested();
  }, [navigate]);

  // Reload profile and posts whenever the URL username or active tab changes
  useEffect(() => {
    setLoadingPosts(true);
    setProfile(null);
    setPosts([]);
    setActiveCommentPost(null);
    setShowModal(false);

    // Fetch the profile user's info
    fetch(`${API}/api/users/profile/${username}`, { credentials: "include" })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(async profileData => {
        setProfile(profileData);
        setEditForm({
          fullname: profileData.fullname || "",
          bio: profileData.bio?.trim() || "",
          username: profileData.username || "",
        });

        // Fetch posts or liked posts based on active tab
        const postsUrl = activeTab === "posts"
          ? `${API}/api/posts/user/${username}`
          : `${API}/api/posts/likes/${profileData._id}`;

        const postsRes = await fetch(postsUrl, { credentials: "include" });
        const postsData = await postsRes.json();

        // Handle both array and object response shapes
        if (activeTab === "posts") {
          setPosts(Array.isArray(postsData) ? postsData : (postsData.posts || []));
        } else {
          setPosts(Array.isArray(postsData) ? postsData : (postsData.likedPosts || []));
        }
      })
      .catch(err => console.error("Profile load error:", err))
      .finally(() => setLoadingPosts(false));
  }, [username, activeTab]);

  // ─── Data fetching helpers ────────────────────────────────────────────────

  const fetchSuggested = async () => {
    try {
      const res = await fetch(`${API}/api/users/suggested`, { credentials: "include" });
      if (res.ok) setSuggestedUsers(await res.json());
    } catch (err) {
      console.error("Fetch suggested error:", err);
    }
  };

  // Re-fetch the current profile (used after follow/unfollow)
  const refreshProfile = async () => {
    try {
      const res = await fetch(`${API}/api/users/profile/${username}`, { credentials: "include" });
      if (res.ok) setProfile(await res.json());
    } catch (err) {
      console.error("Refresh profile error:", err);
    }
  };

  // Re-fetch the post list (used after like/delete/comment)
  const refreshFeed = async () => {
    if (!profile) return;
    try {
      const url = activeTab === "posts"
        ? `${API}/api/posts/user/${username}`
        : `${API}/api/posts/likes/${profile._id}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : (data.posts || data.likedPosts || []));
    } catch (err) {
      console.error("Refresh feed error:", err);
    }
  };

  // ─── Action Handlers ──────────────────────────────────────────────────────

  // Follow or unfollow the profile user
  const handleFollow = async () => {
    if (!profile) return;
    try {
      const res = await fetch(`${API}/api/users/follow/${profile._id}`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        const d = await res.json();
        // Update local following list without re-fetching /me
        const alreadyFollowing = myFollowing.some(f => f.toString() === profile._id.toString());
        setMyFollowing(alreadyFollowing
          ? myFollowing.filter(f => f.toString() !== profile._id.toString())
          : [...myFollowing, profile._id]
        );
        showToast(d.message === "unfollowed" ? "Unfollowed" : "Following!");
        fetchSuggested();
        refreshProfile();
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  // Follow or unfollow a user from the followers/following modal
  const handleFollowModalUser = async (userId) => {
    try {
      const res = await fetch(`${API}/api/users/follow/${userId}`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        const alreadyFollowing = myFollowing.some(f => f.toString() === userId.toString());
        setMyFollowing(alreadyFollowing
          ? myFollowing.filter(f => f.toString() !== userId.toString())
          : [...myFollowing, userId]
        );
        fetchSuggested();
        refreshProfile();
      }
    } catch (err) {
      console.error("Follow modal user error:", err);
    }
  };

  // Remove a follower from your own followers list
  const handleRemoveFollower = async (followerId) => {
    try {
      const res = await fetch(`${API}/api/users/remove-follower/${followerId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        showToast("Follower removed");
        refreshProfile();
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to remove", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  // Follow/unfollow from the "Who to follow" sidebar
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
        refreshProfile();
      }
    } catch (err) {
      console.error("Follow suggested error:", err);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await fetch(`${API}/api/posts/like/${postId}`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        showToast("❤️ Liked!");
        refreshFeed();
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`${API}/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        showToast("Post deleted");
        refreshFeed();
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to delete post", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

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
        refreshFeed();
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

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
        refreshFeed();
      }
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  // Save updated profile info
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/users/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullname: editForm.fullname,
          bio: editForm.bio,
          username: editForm.username,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        showToast("Profile updated!");
        setShowEditModal(false);
        // If username changed, navigate to new profile URL
        if (updated.username !== username) {
          navigate(`/profile/${updated.username}`);
        } else {
          refreshProfile();
        }
      } else {
        const d = await res.json();
        showToast(d.err || "Failed to save", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
    navigate("/login");
  };

  // Return avatar URL — fallback to generated avatar if no profile image
  const getAvatarUrl = (user) => {
    if (user?.profileImg?.trim()) return user.profileImg;
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || "default"}`;
  };

  // ─── Computed values ──────────────────────────────────────────────────────
  const isOwnProfile = profile && myUserId && profile._id === myUserId;
  const isFollowingProfile = profile && myFollowing.some(f => f && f.toString() === profile._id?.toString());

  // ─── Render helpers ───────────────────────────────────────────────────────

  // Renders the comment section for a single post
  const renderCommentsSection = (post) => {
    const rootComments = post.comments.filter(c => !c.parentId);
    return (
      <div className="comments-list">
        <form onSubmit={(e) => handleComment(e, post._id)} className="comment-form">
          <input autoFocus value={commentText} onChange={(e) => setCommentText(e.target.value)}
            type="text" placeholder="Post your reply..." className="comment-input" />
          <button type="submit" disabled={!commentText} className="btn-primary" style={{ padding: "8px 18px" }}>Reply</button>
        </form>

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

              {activeReplyCommentId === comment._id && (
                <form onSubmit={(e) => handleNestedReply(e, post._id, comment._id, comment.user.username)} className="reply-form-inline">
                  <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    type="text" placeholder={`Reply to @${comment.user.username}...`} className="reply-input-inline" />
                  <button type="submit" disabled={!replyText} className="btn-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>Reply</button>
                </form>
              )}

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

  // Renders the followers/following modal
  const renderUserModal = () => {
    if (!showModal || !profile) return null;
    const userList = modalType === "followers" ? (profile.followers || []) : (profile.following || []);
    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{modalType === "followers" ? "Followers" : "Following"}</h3>
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
          </div>
          <div className="modal-content">
            {userList.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px 0" }}>
                No {modalType} yet.
              </p>
            ) : (
              <div className="modal-user-list">
                {userList.map((user, idx) => {
                  if (!user) return null;
                  const uid = user._id || (typeof user === "string" ? user : null);
                  if (!uid) return null;
                  const isOwnUser = uid.toString() === myUserId?.toString();
                  const isFollowing = myFollowing.some(f => f && f.toString() === uid.toString());
                  return (
                    <div key={uid} className="modal-user-item">
                      <div
                        onClick={() => { setShowModal(false); if (user.username) navigate(`/profile/${user.username}`); }}
                        className="modal-user-info"
                      >
                        <div className="modal-avatar" style={{ backgroundImage: `url(${getAvatarUrl(user)})` }} />
                        <div className="modal-user-details">
                          <span className="modal-fullname">{user.fullname || `User ${uid.toString().slice(-4)}`}</span>
                          <span className="modal-username">@{user.username || uid.toString().slice(-4)}</span>
                          {user.bio?.trim() && <p className="modal-bio">{user.bio}</p>}
                        </div>
                      </div>
                      {!isOwnUser && myUserId && (
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          {/* Remove button — only visible on your own followers list */}
                          {modalType === "followers" && isOwnProfile && (
                            <button
                              onClick={() => handleRemoveFollower(uid)}
                              className="btn-outline"
                              style={{ padding: "6px 12px", fontSize: "13px", fontWeight: "700", color: "var(--error-color)", borderColor: "var(--error-color)" }}
                            >
                              Remove
                            </button>
                          )}
                          <button
                            onClick={() => handleFollowModalUser(uid)}
                            className="btn-primary"
                            style={{
                              padding: "6px 14px", fontSize: "13px", fontWeight: "700",
                              backgroundColor: isFollowing ? "transparent" : "var(--text-primary)",
                              color: isFollowing ? "var(--text-primary)" : "var(--bg-color)",
                              border: isFollowing ? "1px solid var(--border-color)" : "none"
                            }}
                          >
                            {isFollowing ? "Unfollow" : "Follow"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renders the edit profile modal
  const renderEditModal = () => {
    if (!showEditModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Edit Profile</h3>
            <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>✕</button>
          </div>
          <div className="modal-content">
            <div className="edit-modal-field">
              <label className="edit-modal-label">Display Name</label>
              <input className="edit-modal-input" value={editForm.fullname}
                onChange={e => setEditForm({ ...editForm, fullname: e.target.value })} placeholder="Your full name" />
            </div>
            <div className="edit-modal-field">
              <label className="edit-modal-label">Username</label>
              <input className="edit-modal-input" value={editForm.username}
                onChange={e => setEditForm({ ...editForm, username: e.target.value })} placeholder="@username" />
            </div>
            <div className="edit-modal-field">
              <label className="edit-modal-label">Bio</label>
              <textarea className="edit-modal-input" value={editForm.bio}
                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell people about yourself" rows={3} style={{ resize: "vertical" }} />
            </div>
            <button onClick={handleSaveProfile} className="btn-primary" disabled={saving}
              style={{ width: "100%", padding: "12px", fontSize: "16px", fontWeight: "700", borderRadius: "9999px" }}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="layout">
      {/* Responsive Navigation */}
      <Navbar
        currentTab="profile"
        myUsername={myUsername}
        unreadCount={0}
        onLogout={handleLogout}
      />

      {/* Main profile content */}
      <div className="main-content">
        <div className="main-header">
          <h3 style={{ margin: 0 }}>{profile?.fullname || username}</h3>
          {!loadingPosts && <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{posts.length} posts</span>}
        </div>

        {/* Show skeleton while loading */}
        {!profile ? (
          [1, 2, 3].map(i => <PostSkeleton key={i} />)
        ) : (
          <>
            {/* Profile header */}
            <div className="profile-cover" />
            <div className="profile-avatar-container">
              <div className="profile-avatar" style={{ backgroundImage: `url(${getAvatarUrl(profile)})` }} />
              <div style={{ display: "flex", gap: "10px" }}>
                {isOwnProfile && (
                  <button onClick={() => setShowEditModal(true)} className="btn-outline"
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Edit2 size={15} /> Edit profile
                  </button>
                )}
                {!isOwnProfile && myUserId && (
                  <button onClick={handleFollow} className="btn-outline"
                    style={{
                      backgroundColor: isFollowingProfile ? "transparent" : "var(--text-primary)",
                      color: isFollowingProfile ? "var(--text-primary)" : "var(--bg-color)"
                    }}>
                    {isFollowingProfile ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            <div className="profile-info">
              <div className="profile-names">
                <p className="profile-fullname">{profile.fullname}</p>
                <p className="profile-username">@{profile.username}</p>
              </div>
              {profile.bio?.trim() && <p className="profile-bio">{profile.bio}</p>}
              <div className="profile-stats">
                {/* Clicking opens the following modal */}
                <span onClick={() => { setModalType("following"); setShowModal(true); }}>
                  <strong className="profile-stat-val">{profile.following.length}</strong> Following
                </span>
                {/* Clicking opens the followers modal */}
                <span onClick={() => { setModalType("followers"); setShowModal(true); }}>
                  <strong className="profile-stat-val">{profile.followers.length}</strong> Followers
                </span>
              </div>
            </div>

            {/* Posts / Likes tabs */}
            <div className="profile-tabs">
              <button className={`profile-tab ${activeTab === "posts" ? "active" : ""}`} onClick={() => setActiveTab("posts")}>
                Posts
              </button>
              <button className={`profile-tab ${activeTab === "likes" ? "active" : ""}`} onClick={() => setActiveTab("likes")}>
                Likes
              </button>
            </div>

            {/* Posts list */}
            {loadingPosts ? (
              [1, 2, 3].map(i => <PostSkeleton key={i} />)
            ) : posts.length === 0 ? (
              <p style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                {activeTab === "posts" ? "No posts yet." : "No liked posts yet."}
              </p>
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
                        {myUserId === post.user._id && (
                          <button onClick={() => handleDeletePost(post._id)} className="delete-post-btn">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {post.text && <p className="post-text">{post.text}</p>}
                      {post.img && <img src={post.img} alt="post" className="post-image" />}

                      <div className="interaction-bar">
                        <div onClick={() => setActiveCommentPost(activeCommentPost === post._id ? null : post._id)} className="interaction-icon">
                          <MessageCircle size={17} /> {post.comments.length}
                        </div>
                        <div
                          onClick={() => handleLikePost(post._id)}
                          className={`interaction-icon ${post.likes.includes(myUserId) ? "liked" : ""}`}
                        >
                          <Heart size={17} fill={post.likes.includes(myUserId) ? "currentColor" : "none"} /> {post.likes.length}
                        </div>
                      </div>

                      {activeCommentPost === post._id && renderCommentsSection(post)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Right sidebar — Who to follow */}
      <div className="right-sidebar">
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
                  <button onClick={() => handleFollowSuggested(user._id)} className="btn-primary"
                    style={{ padding: "6px 14px", fontSize: "13px", fontWeight: "700" }}>
                    <UserPlus size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} /> Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {renderUserModal()}
      {renderEditModal()}
      <ToastContainer />
    </div>
  );
}
