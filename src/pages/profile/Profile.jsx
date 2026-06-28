import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { ToastContainer, showToast } from "../../components/Toast";
import PostSkeleton from "../../components/PostSkeleton";
import { timeAgo } from "../../utils/timeAgo";
import {
  Home as HomeIcon, User as UserIcon, LogOut, MessageCircle,
  Heart, Trash2, CornerDownRight, UserPlus, Bell, Edit2
} from "lucide-react";

export default function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [myUserId, setMyUserId] = useState(null);
  const [myUsername, setMyUsername] = useState("");
  const [myFollowing, setMyFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("followers");

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullname: "", bio: "", username: "" });
  const [saving, setSaving] = useState(false);

  // Comment states
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setMyUserId(d._id); setMyUsername(d.username); setMyFollowing(d.following || []); })
      .catch(() => navigate("/login"));
    fetchSuggested();
  }, [navigate]);

  useEffect(() => {
    setLoadingPosts(true);
    setProfile(null); setPosts([]); setActiveCommentPost(null); setShowModal(false);

    apiFetch(`/api/users/profile/${username}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(async profileData => {
        setProfile(profileData);
        setEditForm({ fullname: profileData.fullname || "", bio: profileData.bio?.trim() || "", username: profileData.username || "" });
        const feedRes = activeTab === "posts"
          ? await apiFetch(`/api/posts/user/${username}`)
          : await apiFetch(`/api/posts/likes/${profileData._id}`);
        const feedData = await feedRes.json();
        setPosts(activeTab === "posts" ? (feedData.posts || []) : (feedData || []));
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, [username, activeTab]);

  const fetchSuggested = async () => {
    try {
      const r = await apiFetch("/api/users/suggested");
      if (r.ok) setSuggestedUsers(await r.json());
    } catch (e) { console.error(e); }
  };

  const refreshProfile = async () => {
    try {
      const r = await apiFetch(`/api/users/profile/${username}`);
      if (r.ok) setProfile(await r.json());
    } catch (e) { console.error(e); }
  };

  const refreshFeed = async () => {
    if (!profile) return;
    try {
      if (activeTab === "posts") {
        const r = await apiFetch(`/api/posts/user/${username}`); const d = await r.json(); setPosts(d.posts || []);
      } else {
        const r = await apiFetch(`/api/posts/likes/${profile._id}`); const d = await r.json(); setPosts(d || []);
      }
    } catch (e) { console.error(e); }
  };

  const handleFollow = async () => {
    if (!profile) return;
    try {
      const res = await apiFetch(`/api/users/follow/${profile._id}`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        const wasFollowing = myFollowing.some(f => f.toString() === profile._id.toString());
        setMyFollowing(wasFollowing
          ? myFollowing.filter(f => f.toString() !== profile._id.toString())
          : [...myFollowing, profile._id]);
        showToast(d.message === "unfollowed" ? "Unfollowed" : "Following!");
        fetchSuggested(); refreshProfile();
      }
    } catch (e) { console.error(e); }
  };

  const handleFollowModalUser = async (id) => {
    try {
      const res = await apiFetch(`/api/users/follow/${id}`, { method: "POST" });
      if (res.ok) {
        const wasFollowing = myFollowing.some(f => f.toString() === id.toString());
        setMyFollowing(wasFollowing
          ? myFollowing.filter(f => f.toString() !== id.toString())
          : [...myFollowing, id]);
        fetchSuggested(); refreshProfile();
      }
    } catch (e) { console.error(e); }
  };

  const handleRemoveFollower = async (followerId) => {
    try {
      const res = await apiFetch(`/api/users/remove-follower/${followerId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Follower removed");
        refreshProfile();
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to remove", "error");
      }
    } catch (e) { showToast("Network error", "error"); }
  };

  const handleFollowSuggested = async (id) => {
    try {
      const res = await apiFetch(`/api/users/follow/${id}`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        showToast(d.message === "unfollowed" ? "Unfollowed" : "Following!");
        fetchSuggested(); refreshProfile();
      }
    } catch (e) { console.error(e); }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await apiFetch(`/api/posts/like/${postId}`, { method: "POST" });
      if (res.ok) { showToast("❤️ Liked!"); refreshFeed(); }
    } catch (e) { console.error(e); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Post deleted");
        refreshFeed();
      } else {
        const d = await res.json();
        showToast(d.error || d.err || "Failed to delete post", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
      console.error(e);
    }
  };

  const handleComment = async (e, postId) => {
    e.preventDefault(); if (!commentText) return;
    try {
      const res = await apiFetch(`/api/posts/comment/${postId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) { setCommentText(""); showToast("Reply posted!"); refreshFeed(); }
    } catch (e) { console.error(e); }
  };

  const handleNestedReply = async (e, postId, parentCommentId, replyToUsername) => {
    e.preventDefault(); if (!replyText) return;
    try {
      const res = await apiFetch(`/api/posts/comment/${postId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText, parentId: parentCommentId, replyToUsername })
      });
      if (res.ok) { setReplyText(""); setActiveReplyCommentId(null); showToast("Reply posted!"); refreshFeed(); }
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/users/update", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname: editForm.fullname, bio: editForm.bio, username: editForm.username })
      });
      if (res.ok) {
        const updated = await res.json();
        showToast("Profile updated!");
        setShowEditModal(false);
        if (updated.username !== username) {
          navigate(`/profile/${updated.username}`);
        } else {
          refreshProfile();
        }
      } else {
        const d = await res.json();
        showToast(d.err || "Failed to save", "error");
      }
    } catch (e) { showToast("Network error", "error"); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    navigate("/login");
  };

  const getAvatarUrl = (user) => {
    if (user?.profileImg?.trim()) return user.profileImg;
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'default'}`;
  };

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
                    <Link to={`/profile/${comment.user.username}`} className="post-author" style={{ fontWeight: "700" }}>{comment.user.fullname}</Link>
                    <span style={{ color: "var(--text-secondary)", fontSize: "13px", marginLeft: "6px" }}>@{comment.user.username}</span>
                    {comment.createdAt && <span style={{ color: "var(--text-secondary)", fontSize: "12px", marginLeft: "8px" }}>· {timeAgo(comment.createdAt)}</span>}
                  </div>
                  <p style={{ marginTop: "2px", fontSize: "14px" }}>{comment.text}</p>
                  <div className="comment-actions">
                    <button onClick={() => { setActiveReplyCommentId(activeReplyCommentId === comment._id ? null : comment._id); setReplyText(""); }} className="comment-action-btn">
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
                      <Link to={`/profile/${reply.user.username}`} className="nested-comment-avatar" style={{ backgroundImage: `url(${getAvatarUrl(reply.user)})` }} />
                      <div className="comment-body">
                        <div>
                          <Link to={`/profile/${reply.user.username}`} className="post-author" style={{ fontWeight: "700" }}>{reply.user.fullname}</Link>
                          <span style={{ color: "var(--text-secondary)", fontSize: "12px", marginLeft: "6px" }}>@{reply.user.username}</span>
                        </div>
                        <p style={{ marginTop: "2px", fontSize: "13px" }}>
                          <span style={{ color: "var(--accent-color)", marginRight: "4px" }}>@{reply.replyToUsername}</span>{reply.text}
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
            {userList.length === 0
              ? <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px 0" }}>No {modalType} yet.</p>
              : <div className="modal-user-list">
                {userList.map((user, idx) => {
                  if (!user) return null;
                  const uid = user._id || (typeof user === "string" ? user : null);
                  if (!uid) return null;
                  const isOwnUser = uid.toString() === myUserId?.toString();
                  const isFollowing = myFollowing.some(f => f && f.toString() === uid.toString());
                  return (
                    <div key={uid} className="modal-user-item">
                      <div onClick={() => { setShowModal(false); if (user.username) navigate(`/profile/${user.username}`); }} className="modal-user-info">
                        <div className="modal-avatar" style={{ backgroundImage: `url(${getAvatarUrl(user)})` }} />
                        <div className="modal-user-details">
                          <span className="modal-fullname">{user.fullname || `User ${uid.toString().slice(-4)}`}</span>
                          <span className="modal-username">@{user.username || uid.toString().slice(-4)}</span>
                          {user.bio?.trim() && <p className="modal-bio">{user.bio}</p>}
                        </div>
                      </div>
                      {!isOwnUser && myUserId && (
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          {/* Show Remove button only on YOUR own followers list */}
                          {modalType === "followers" && isOwnProfile && (
                            <button
                              onClick={() => handleRemoveFollower(uid)}
                              className="btn-outline"
                              style={{ padding: "6px 12px", fontSize: "13px", fontWeight: "700", color: "var(--error-color)", borderColor: "var(--error-color)" }}
                            >
                              Remove
                            </button>
                          )}
                          {/* Show Follow/Unfollow for everyone */}
                          <button onClick={() => handleFollowModalUser(uid)} className="btn-primary"
                            style={{ padding: "6px 14px", fontSize: "13px", fontWeight: "700", backgroundColor: isFollowing ? "transparent" : "var(--text-primary)", color: isFollowing ? "var(--text-primary)" : "var(--bg-color)", border: isFollowing ? "1px solid var(--border-color)" : "none" }}>
                            {isFollowing ? "Unfollow" : "Follow"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            }
          </div>
        </div>
      </div>
    );
  };

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

  const isOwnProfile = profile && myUserId && profile._id === myUserId;
  const isFollowingProfile = profile && myFollowing.some(f => f && f.toString() === profile._id?.toString());

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>X Clone</h2>
        <Link to="/" className="sidebar-link"><HomeIcon size={22} /> Home</Link>
        {myUsername && <Link to={`/profile/${myUsername}`} className="sidebar-link"><UserIcon size={22} /> Profile</Link>}
        <Link to="/notifications" className="sidebar-link"><Bell size={22} /> Notifications</Link>
        <button onClick={handleLogout} className="sidebar-btn"><LogOut size={18} /> Log out</button>
      </div>

      <div className="main-content">
        <div className="main-header">
          <h3 style={{ margin: 0 }}>{profile?.fullname || username}</h3>
          {!loadingPosts && <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{posts.length} posts</span>}
        </div>

        {!profile ? (
          [1, 2, 3].map(i => <PostSkeleton key={i} />)
        ) : (
          <>
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
                    style={{ backgroundColor: isFollowingProfile ? "transparent" : "var(--text-primary)", color: isFollowingProfile ? "var(--text-primary)" : "var(--bg-color)" }}>
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
                <span onClick={() => { setModalType("following"); setShowModal(true); }}>
                  <strong className="profile-stat-val">{profile.following.length}</strong> Following
                </span>
                <span onClick={() => { setModalType("followers"); setShowModal(true); }}>
                  <strong className="profile-stat-val">{profile.followers.length}</strong> Followers
                </span>
              </div>
            </div>

            <div className="profile-tabs">
              <button className={`profile-tab ${activeTab === "posts" ? "active" : ""}`} onClick={() => setActiveTab("posts")}>Posts</button>
              <button className={`profile-tab ${activeTab === "likes" ? "active" : ""}`} onClick={() => setActiveTab("likes")}>Likes</button>
            </div>

            {loadingPosts
              ? [1, 2, 3].map(i => <PostSkeleton key={i} />)
              : posts.length === 0
                ? <p style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>{activeTab === "posts" ? "No posts yet." : "No liked posts yet."}</p>
                : posts.map(post => (
                  <div key={post._id} className="post-card">
                    <div style={{ display: "flex", gap: "12px" }}>
                      <Link to={`/profile/${post.user.username}`} className="post-avatar" style={{ backgroundImage: `url(${getAvatarUrl(post.user)})` }} />
                      <div style={{ width: "100%" }}>
                        <div className="post-header" style={{ justifyContent: "space-between" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "baseline", flexWrap: "wrap" }}>
                            <Link to={`/profile/${post.user.username}`} className="post-author">{post.user.fullname}</Link>
                            <Link to={`/profile/${post.user.username}`} className="post-username">@{post.user.username}</Link>
                            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>· {timeAgo(post.createdAt)}</span>
                          </div>
                          {myUserId === post.user._id && (
                            <button onClick={() => handleDeletePost(post._id)} className="delete-post-btn"><Trash2 size={16} /></button>
                          )}
                        </div>
                        {post.text && <p className="post-text">{post.text}</p>}
                        {post.img && <img src={post.img} alt="post" className="post-image" />}
                        <div className="interaction-bar">
                          <div onClick={() => setActiveCommentPost(activeCommentPost === post._id ? null : post._id)} className="interaction-icon">
                            <MessageCircle size={17} /> {post.comments.length}
                          </div>
                          <div onClick={() => handleLikePost(post._id)} className={`interaction-icon ${post.likes.includes(myUserId) ? "liked" : ""}`}>
                            <Heart size={17} fill={post.likes.includes(myUserId) ? "currentColor" : "none"} /> {post.likes.length}
                          </div>
                        </div>
                        {activeCommentPost === post._id && renderCommentsSection(post)}
                      </div>
                    </div>
                  </div>
                ))
            }
          </>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        {suggestedUsers.length > 0 && (
          <div className="suggested-card">
            <h4>Who to follow</h4>
            <div className="suggested-list">
              {suggestedUsers.map(user => (
                <div key={user._id} className="suggested-item">
                  <div className="suggested-user-info">
                    <Link to={`/profile/${user.username}`} className="suggested-avatar" style={{ backgroundImage: `url(${getAvatarUrl(user)})` }} />
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
