import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [userId, setUserId] = useState(null);
  const [myUsername, setMyUsername] = useState("");
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
    
    // 2. Fetch the Feed
    fetchPosts();
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const res = await apiFetch("/api/posts/all");
      const data = await res.json();
      if(res.ok) setPosts(data);
    } catch (e) {
      console.error(e);
    }
  }

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
  }

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
              setActiveCommentPost(null);
              fetchPosts(); // Reload feed to show new comment
          }
      } catch(e) {
          console.error(e);
      }
  };

  const handleLogout = async () => {
     await apiFetch("/api/auth/logout", { method: "POST"});
     navigate("/login");
  }

  return (
    <div className="layout">
      {/* Sidebar (Left) */}
      <div className="sidebar">
         <h2>X Clone</h2>
         <Link to="/" className="sidebar-link">🏠 Home</Link>
         {myUsername && <Link to={`/profile/${myUsername}`} className="sidebar-link">👤 Profile</Link>}
         <button onClick={handleLogout} className="sidebar-btn">🚪 Log out</button>
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
                  <Link to={`/profile/${post.user.username}`} className="post-avatar" />
                  <div style={{width: "100%"}}>
                     <div className="post-header">
                        <Link to={`/profile/${post.user.username}`} className="post-author">{post.user.fullname}</Link>
                        <Link to={`/profile/${post.user.username}`} className="post-username">@{post.user.username}</Link>
                     </div>
                     <p className="post-text">{post.text}</p>
                     
                     <div className="interaction-bar">
                        <div 
                           onClick={() => setActiveCommentPost(activeCommentPost === post._id ? null : post._id)} 
                           className="interaction-icon"
                        >
                           💬 {post.comments.length}
                        </div>
                        <div 
                           onClick={() => handleLikePost(post._id)}
                           className={`interaction-icon ${post.likes.includes(userId) ? "liked" : ""}`}
                        >
                           ❤️ {post.likes.length}
                        </div>
                     </div>

                     {/* Hidden Dynamic Comment Section */}
                     {activeCommentPost === post._id && (
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
                     )}

                     {/* Inline Display of Comments */}
                     {post.comments.length > 0 && activeCommentPost === post._id && (
                         <div className="comments-list">
                             {post.comments.map(c => (
                                 <div key={c._id} className="comment-item">
                                     <div className="comment-avatar" />
                                     <div className="comment-body">
                                        <strong>{c.user.fullname}</strong> <span style={{color: "var(--text-secondary)"}}>@{c.user.username}</span>
                                        <p style={{marginTop: "2px"}}>{c.text}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}

                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  )
}
