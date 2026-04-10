import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
    fetch("/api/auth/me")
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
      const res = await fetch("/api/posts/all");
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
      const res = await fetch("/api/posts/create", {
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
      const res = await fetch(`/api/posts/like/${postId}`, {
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
          const res = await fetch(`/api/posts/comment/${postId}`, {
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
     await fetch("/api/auth/logout", { method: "POST"});
     navigate("/login");
  }

  return (
    <div className="layout">
      {/* Sidebar (Left) */}
      <div className="sidebar">
         <h2>X Clone</h2>
         <Link to="/" style={{marginTop: "20px", fontSize: "20px", fontWeight: "bold", display: "block"}}>Home</Link>
         {myUsername && <Link to={`/profile/${myUsername}`} style={{marginTop: "15px", fontSize: "20px", fontWeight: "bold", display: "block"}}>Profile</Link>}
         <button onClick={handleLogout} style={{marginTop: "auto", marginBottom: "20px", color: "var(--text-secondary)", fontSize: "16px", textAlign: "left"}}>Log out</button>
      </div>

      {/* Main Feed (Center) */}
      <div className="main-content">
         <h3 style={{padding: "15px", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)"}}>Home</h3>
         
         {/* Create Post Section */}
         <div style={{padding: "15px", borderBottom: "1px solid var(--border-color)", display: "flex", flexDirection: "column"}}>
            <textarea 
               value={text} 
               onChange={(e) => setText(e.target.value)} 
               placeholder="What is happening?!" 
               style={{border: "none", resize: "none", height: "80px", outline: "none", fontSize: "20px", background: "transparent"}}
            />
            <div style={{display: "flex", justifyContent: "flex-end", marginTop: "10px"}}>
               <button className="btn-primary" onClick={handlePost} disabled={!text}>Post</button>
            </div>
         </div>

         {/* Posts List Section */}
         {posts.length === 0 ? (
            <p style={{padding: "15px", textAlign:"center", color: "var(--text-secondary)"}}>No posts yet. Say something!</p>
         ) : posts.map(post => (
            <div key={post._id} style={{padding: "20px", borderBottom: "1px solid var(--border-color)"}}>
               <div style={{display: "flex", gap: "12px"}}>
                  <Link to={`/profile/${post.user.username}`} style={{width: "48px", height: "48px", backgroundColor: "#333", borderRadius: "50%", flexShrink: 0, display: "block"}} />
                  <div style={{width: "100%"}}>
                     <Link to={`/profile/${post.user.username}`} style={{fontWeight: "bold", marginRight: "5px"}}>{post.user.fullname}</Link>
                     <Link to={`/profile/${post.user.username}`} style={{color: "var(--text-secondary)"}}>@{post.user.username}</Link>
                     <p style={{marginTop: "8px", fontSize: "15px", lineHeight: "1.5"}}>{post.text}</p>
                     
                     <div style={{display:"flex", gap:"30px", marginTop:"12px", color: "var(--text-secondary)", userSelect: "none"}}>
                        <span onClick={() => setActiveCommentPost(activeCommentPost === post._id ? null : post._id)} style={{cursor: "pointer"}}>💬 {post.comments.length}</span>
                        <span 
                           onClick={() => handleLikePost(post._id)}
                           style={{cursor: "pointer", color: post.likes.includes(userId) ? "#f91880" : "inherit"}}
                        >
                           ❤️ {post.likes.length}
                        </span>
                     </div>

                     {/* Hidden Dynamic Comment Section */}
                     {activeCommentPost === post._id && (
                         <form onSubmit={(e) => handleComment(e, post._id)} style={{marginTop: "15px", display:"flex", gap:"10px"}}>
                             <input autoFocus value={commentText} onChange={(e)=>setCommentText(e.target.value)} type="text" placeholder="Post your reply..." style={{flex: 1, padding: "10px 15px", borderRadius: "20px", border: "1px solid var(--border-color)", fontSize: "15px"}} />
                             <button type="submit" disabled={!commentText} className="btn-primary" style={{padding: "8px 18px"}}>Reply</button>
                         </form>
                     )}

                     {/* Inline Display of Comments */}
                     {post.comments.length > 0 && activeCommentPost === post._id && (
                         <div style={{marginTop: "15px", borderTop: "1px solid var(--border-color)", paddingTop: "15px"}}>
                             {post.comments.map(c => (
                                 <div key={c._id} style={{marginBottom: "15px", fontSize: "14px", display: "flex", gap: "8px"}}>
                                     <div style={{width: "30px", height: "30px", backgroundColor: "#444", borderRadius: "50%", flexShrink: 0}} />
                                     <div>
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
