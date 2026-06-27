import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { 
  Home as HomeIcon, 
  User as UserIcon, 
  LogOut, 
  MessageCircle, 
  Heart, 
  Trash2, 
  CornerDownRight, 
  UserPlus 
} from "lucide-react";

export default function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [myUsername, setMyUsername] = useState("");
  const [myFollowing, setMyFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts"); // "posts" or "likes"
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("followers"); // "followers" or "following"

  // Comment states
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/auth/me").then(res => {
      if (res.ok) return res.json();
      throw new Error("Not logged in");
    })
    .then(data => {
      if(data._id) {
         setMyUserId(data._id);
         setMyUsername(data.username);
         setMyFollowing(data.following || []);
      }
    })
    .catch(() => {
      navigate("/login");
    });

    fetchSuggested();
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    setProfile(null);
    setPosts([]);
    setActiveCommentPost(null);
    setShowModal(false);
    
    apiFetch(`/api/users/profile/${username}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Profile not found");
      })
      .then(profileData => {
        if (profileData._id) {
          setProfile(profileData);
          if (activeTab === "posts") {
            return apiFetch(`/api/posts/user/${username}`).then(res => res.json().then(postsData => {
              setPosts(postsData.posts || []);
            }));
          } else {
            return apiFetch(`/api/posts/likes/${profileData._id}`).then(res => res.json().then(likesData => {
              setPosts(likesData || []);
            }));
          }
        }
      })
      .catch(err => {
        console.error("Error loading profile details:", err);
      })
      .finally(() => setLoading(false));
  }, [username, activeTab]);

  const fetchSuggested = async () => {
    try {
      const res = await apiFetch("/api/users/suggested");
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowSuggested = async (id) => {
    try {
      const res = await apiFetch(`/api/users/follow/${id}`, {
        method: "POST"
      });
      if (res.ok) {
        if (myFollowing.some(fid => fid.toString() === id.toString())) {
          setMyFollowing(myFollowing.filter(fid => fid.toString() !== id.toString()));
        } else {
          setMyFollowing([...myFollowing, id]);
        }
        fetchSuggested();
        refreshProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowModalUser = async (id) => {
    try {
      const res = await apiFetch(`/api/users/follow/${id}`, {
        method: "POST"
      });
      if (res.ok) {
        if (myFollowing.some(fid => fid.toString() === id.toString())) {
          setMyFollowing(myFollowing.filter(fid => fid.toString() !== id.toString()));
        } else {
          setMyFollowing([...myFollowing, id]);
        }
        fetchSuggested();
        refreshProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await apiFetch(`/api/users/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollow = async () => {
    if (!myUserId || !profile) return;
    try {
      const res = await apiFetch(`/api/users/follow/${profile._id}`, {
        method: "POST"
      });
      if (res.ok) {
        if (myFollowing.some(fid => fid.toString() === profile._id.toString())) {
          setMyFollowing(myFollowing.filter(fid => fid.toString() !== profile._id.toString()));
        } else {
          setMyFollowing([...myFollowing, profile._id]);
        }
        fetchSuggested();
        refreshProfile();
      }
    } catch(e) { console.error(e) }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await apiFetch(`/api/posts/like/${postId}`, {
        method: "POST"
      });
      if(res.ok) {
        refreshFeed();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await apiFetch(`/api/posts/${postId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        refreshFeed();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (e, postId) => {
      e.preventDefault();
      if(!commentText) return;
      try {
          const res = await apiFetch(`/api/posts/comment/${postId}`, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({text: commentText})
          });
          if(res.ok) {
              setCommentText("");
              refreshFeed();
          }
      } catch(e) {
          console.error(e);
      }
  };

  const handleNestedReply = async (e, postId, parentCommentId, replyToUsername) => {
      e.preventDefault();
      if(!replyText) return;
      try {
          const res = await apiFetch(`/api/posts/comment/${postId}`, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({
                  text: replyText,
                  parentId: parentCommentId,
                  replyToUsername: replyToUsername
              })
          });
          if(res.ok) {
              setReplyText("");
              setActiveReplyCommentId(null);
              refreshFeed();
          }
      } catch(e) {
          console.error(e);
      }
  };

  const refreshFeed = async () => {
    if (!profile) return;
    try {
      if (activeTab === "posts") {
        const r = await apiFetch(`/api/posts/user/${username}`);
        const d = await r.json();
        setPosts(d.posts || []);
      } else {
        const r = await apiFetch(`/api/posts/likes/${profile._id}`);
        const d = await r.json();
        setPosts(d || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
     await apiFetch("/api/auth/logout", { method: "POST"});
     navigate("/login");
  };

  const getAvatarUrl = (user) => {
    if (user && user.profileImg && user.profileImg.trim()) {
      return user.profileImg;
    }
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'default'}`;
  };

  const renderCommentsSection = (post) => {
    const rootComments = post.comments.filter(c => !c.parentId);
    
    return (
      <div className="comments-list">
        {/* Comment Input */}
        <form onSubmit={(e) => handleComment(e, post._id)} className="comment-form">
          <input 
            autoFocus 
            value={commentText} 
            onChange={(e)=>setCommentText(e.target.value)} 
            type="text" 
            placeholder="Post your reply..." 
            className="comment-input" 
          />
          <button type="submit" disabled={!commentText} className="btn-primary" style={{padding: "8px 18px"}}>Reply</button>
        </form>

        {rootComments.map(comment => {
          const replies = post.comments.filter(r => r.parentId === comment._id);
          
          return (
            <div key={comment._id} className="comment-wrapper">
              {/* Root Comment Item */}
              <div className="comment-item">
                <Link to={`/profile/${comment.user.username}`} className="comment-avatar" style={{ backgroundImage: `url(${getAvatarUrl(comment.user)})`, width: "36px", height: "36px" }} />
                <div className="comment-body">
                  <div>
                    <Link to={`/profile/${comment.user.username}`} style={{fontWeight: "700"}} className="post-author">{comment.user.fullname}</Link>
                    <span style={{color: "var(--text-secondary)", fontSize: "13px", marginLeft: "6px"}}>@{comment.user.username}</span>
                  </div>
                  <p style={{marginTop: "2px", fontSize: "14px"}}>{comment.text}</p>
                  
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

              {/* Inline Reply Box */}
              {activeReplyCommentId === comment._id && (
                <form onSubmit={(e) => handleNestedReply(e, post._id, comment._id, comment.user.username)} className="reply-form-inline">
                  <input 
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    type="text"
                    placeholder={`Reply to @${comment.user.username}...`}
                    className="reply-input-inline"
                  />
                  <button type="submit" disabled={!replyText} className="btn-primary" style={{padding: "6px 14px", fontSize: "13px"}}>Reply</button>
                </form>
              )}

              {/* Nested Replies List */}
              {replies.length > 0 && (
                <div className="nested-replies">
                  {replies.map(reply => (
                    <div key={reply._id} className="nested-comment-item">
                      <Link to={`/profile/${reply.user.username}`} className="nested-comment-avatar" style={{ backgroundImage: `url(${getAvatarUrl(reply.user)})` }} />
                      <div className="comment-body">
                        <div>
                          <Link to={`/profile/${reply.user.username}`} style={{fontWeight: "700"}} className="post-author">{reply.user.fullname}</Link>
                          <span style={{color: "var(--text-secondary)", fontSize: "12px", marginLeft: "6px"}}>@{reply.user.username}</span>
                        </div>
                        <p style={{marginTop: "2px", fontSize: "13px"}}>
                          <span style={{color: "var(--accent-color)", marginRight: "4px"}}>@{reply.replyToUsername}</span>
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

  const renderUserModal = () => {
    if (!showModal) return null;
    const userList = modalType === "followers" ? (profile.followers || []) : (profile.following || []);
    const title = modalType === "followers" ? "Followers" : "Following";

    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close-btn" onClick={() => setShowModal(false)} style={{ fontSize: "16px", fontWeight: "bold" }}>✕</button>
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
                  
                  const userId = user._id || (typeof user === 'string' ? user : null);
                  if (!userId) return null;

                  const isOwnUser = userId.toString() === myUserId?.toString();
                  const isFollowingUser = myFollowing.some(fid => fid && fid.toString() === userId.toString());
                  
                  const userKey = user._id ? user._id : `unpopulated-${idx}`;
                  const username = user.username || `user_${userId.toString().slice(-4)}`;
                  const fullname = user.fullname || `User ${userId.toString().slice(-4)}`;
                  
                  return (
                    <div key={userKey} className="modal-user-item">
                      <div 
                        onClick={() => {
                          setShowModal(false);
                          if (user.username) {
                            navigate(`/profile/${user.username}`);
                          }
                        }} 
                        className="modal-user-info"
                      >
                        <div className="modal-avatar" style={{ backgroundImage: `url(${getAvatarUrl(user)})` }} />
                        <div className="modal-user-details">
                          <span className="modal-fullname">{fullname}</span>
                          <span className="modal-username">@{username}</span>
                          {user.bio && user.bio.trim() && <p className="modal-bio">{user.bio}</p>}
                        </div>
                      </div>
                      
                      {!isOwnUser && myUserId && (
                        <button 
                          onClick={() => handleFollowModalUser(userId)}
                          className="btn-primary"
                          style={{
                            padding: "6px 14px",
                            fontSize: "13px",
                            fontWeight: "700",
                            backgroundColor: isFollowingUser ? "transparent" : "var(--text-primary)",
                            color: isFollowingUser ? "var(--text-primary)" : "var(--bg-color)",
                            border: isFollowingUser ? "1px solid var(--border-color)" : "none"
                          }}
                        >
                          {isFollowingUser ? "Unfollow" : "Follow"}
                        </button>
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

  if (loading) return <div style={{padding: "20px", textAlign: "center", color: "var(--text-secondary)"}}>Loading...</div>;
  if (!profile) return <div style={{padding: "20px", textAlign: "center", color: "var(--text-secondary)"}}>User not found</div>;

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
         <h2>X Clone</h2>
         <Link to="/" className="sidebar-link"><HomeIcon size={22} /> Home</Link>
         {myUsername && <Link to={`/profile/${myUsername}`} className="sidebar-link"><UserIcon size={22} /> Profile</Link>}
         <button onClick={handleLogout} className="sidebar-btn"><LogOut size={18} /> Log out</button>
      </div>

      <div className="main-content">
        {/* Sticky Header Top */}
        <div className="main-header">
          <h3 style={{margin: 0}}>{profile.fullname}</h3>
          <span style={{color: "var(--text-secondary)", fontSize: "14px"}}>{posts.length} posts</span>
        </div>

        {/* Profile Cover Header */}
        <div className="profile-cover" />

        {/* Profile Avatar & Follow Button */}
        <div className="profile-avatar-container">
          <div className="profile-avatar" style={{ backgroundImage: `url(${getAvatarUrl(profile)})` }} />
          {myUserId && profile._id !== myUserId && (
             <button 
               onClick={handleFollow}
               className="btn-outline" 
               style={{
                 backgroundColor: myFollowing.some(fid => fid.toString() === profile._id.toString()) ? "transparent" : "var(--text-primary)", 
                 color: myFollowing.some(fid => fid.toString() === profile._id.toString()) ? "var(--text-primary)" : "var(--bg-color)"
               }}
             >
               {myFollowing.some(fid => fid.toString() === profile._id.toString()) ? "Unfollow" : "Follow"}
             </button>
          )}
        </div>

        {/* Profile Header Details */}
        <div className="profile-info">
          <div className="profile-names">
            <p className="profile-fullname">{profile.fullname}</p>
            <p className="profile-username">@{profile.username}</p>
          </div>
          
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-stats">
            <span onClick={() => { setModalType("following"); setShowModal(true); }}>
              <strong className="profile-stat-val">{profile.following.length}</strong> Following
            </span>
            <span onClick={() => { setModalType("followers"); setShowModal(true); }}>
              <strong className="profile-stat-val">{profile.followers.length}</strong> Followers
            </span>
          </div>
        </div>

        {/* Tabs: Posts vs Likes */}
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>
          <button 
            className={`profile-tab ${activeTab === "likes" ? "active" : ""}`}
            onClick={() => setActiveTab("likes")}
          >
            Likes
          </button>
        </div>

        {/* Users Posts Feed */}
        {posts.length === 0 ? (
          <p style={{padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)"}}>
            {activeTab === "posts" ? "No posts yet." : "No liked posts yet."}
          </p>
        ) : posts.map(post => (
           <div key={post._id} className="post-card">
              <div style={{display: "flex", gap: "12px"}}>
                 <Link to={`/profile/${post.user.username}`} className="post-avatar" style={{ backgroundImage: `url(${getAvatarUrl(post.user)})` }} />
                 <div style={{width: "100%"}}>
                    <div className="post-header" style={{ justifyContent: "space-between" }}>
                       <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
                         <Link to={`/profile/${post.user.username}`} className="post-author">{post.user.fullname}</Link>
                         <Link to={`/profile/${post.user.username}`} className="post-username">@{post.user.username}</Link>
                       </div>
                       {myUserId === post.user._id && (
                         <button onClick={() => handleDeletePost(post._id)} className="delete-post-btn" title="Delete Post">
                           <Trash2 size={16} />
                         </button>
                       )}
                    </div>
                    <p className="post-text">{post.text}</p>
                    
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

                    {/* Dynamic Comment Section */}
                    {activeCommentPost === post._id && renderCommentsSection(post)}
                 </div>
              </div>
           </div>
        ))}
      </div>

      {/* Right Sidebar (Suggested Users) */}
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

      {/* Followers / Following Modal */}
      {renderUserModal()}
    </div>
  );
}
