import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [userId, setUserId] = useState(null);
  const [myUsername, setMyUsername] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Verify Authentication 
    apiFetch("/api/auth/me")
      .then(res => {
         if (!res.ok) throw new Error("Not logged in");
         return res.json();
      })
      .then(data => {
        if(data._id) {
            setUserId(data._id);
            setMyUsername(data.username);
        }
      })
      .catch((err) => {
        navigate("/login"); // Kick back to login if no cookie
      });
    
    // 2. Fetch the Feed & Suggested Users
    fetchPosts();
    fetchSuggested();
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const res = await apiFetch("/api/posts/all");
      const data = await res.json();
      if(res.ok) setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

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

  const handlePost = async (e) => {
    e.preventDefault();
    if(!text) return;
    try {
      const res = await apiFetch("/api/posts/create", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({text})
      });
      if(res.ok) {
        setText("");
        fetchPosts(); // Reload feed to show new post
      }
    } catch (e) {
      console.error(e)
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await apiFetch(`/api/posts/like/${postId}`, {
        method: "POST"
      });
      if(res.ok) {
        fetchPosts(); // Reload feed to show updated likes
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
        fetchPosts();
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
        fetchSuggested();
        fetchPosts(); // reload feed in case they posted something
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
              fetchPosts(); // Reload feed to show new comment
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
              fetchPosts(); // Reload feed to show new reply
          }
      } catch(e) {
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

  return (
    <div className="layout">
      {/* Sidebar (Left) */}
      <div className="sidebar">
         <h2>X Clone</h2>
         <Link to="/" className="sidebar-link"><HomeIcon size={22} /> Home</Link>
         {myUsername && <Link to={`/profile/${myUsername}`} className="sidebar-link"><UserIcon size={22} /> Profile</Link>}
         <button onClick={handleLogout} className="sidebar-btn"><LogOut size={18} /> Log out</button>
      </div>

      {/* Main Feed (Center) */}
      <div className="main-content">
         <div className="main-header">
            <h3>Home</h3>
         </div>
         
         {/* Create Post Section */}
         <div className="create-post-container">
            <textarea 
               value={text} 
               onChange={(e) => setText(e.target.value)} 
               placeholder="What is happening?!" 
               className="create-post-textarea"
            />
            <div className="create-post-footer">
               <button className="btn-primary" onClick={handlePost} disabled={!text}>Post</button>
            </div>
         </div>

         {/* Posts List Section */}
         {posts.length === 0 ? (
            <p style={{padding: "20px", textAlign:"center", color: "var(--text-secondary)"}}>No posts yet. Say something!</p>
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
                        {userId === post.user._id && (
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
                           className={`interaction-icon ${post.likes.includes(userId) ? "liked" : ""}`}
                        >
                           <Heart size={17} fill={post.likes.includes(userId) ? "currentColor" : "none"} /> {post.likes.length}
                        </div>
                     </div>

                     {/* Dynamic Comment Section */}
                     {activeCommentPost === post._id && renderCommentsSection(post)}
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* Right Sidebar (Who to follow) */}
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
    </div>
  )
}
