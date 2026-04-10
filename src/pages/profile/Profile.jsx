import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [myUsername, setMyUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(res=>res.json()).then(data=>{
      if(data._id) {
         setMyUserId(data._id);
         setMyUsername(data.username);
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    // Fetch profile stats
    fetch(`/api/users/profile/${username}`)
      .then(res => res.json())
      .then(data => {
        if(data._id) setProfile(data);
      });

    // Fetch user's posts
    fetch(`/api/posts/user/${username}`)
      .then(res => res.json())
      .then(data => {
        if(data.posts) setPosts(data.posts);
      })
      .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    try {
      const res = await fetch(`/api/users/follow/${profile._id}`, {
        method: "POST"
      });
      if(res.ok) {
        // Make the button update instantly before relying on another fetch
        const isFollowing = profile.followers.includes(myUserId);
        const updatedFollowers = isFollowing 
            ? profile.followers.filter(id => id !== myUserId)
            : [...profile.followers, myUserId];
            
        setProfile({...profile, followers: updatedFollowers});
      }
    } catch(e) { console.error(e) }
  }

  if (loading) return <div style={{padding: "20px"}}>Loading...</div>;
  if (!profile) return <div style={{padding: "20px"}}>User not found</div>;

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar" style={{display: "flex", flexDirection: "column"}}>
         <h2>X Clone</h2>
         <Link to="/" style={{marginTop: "20px", fontSize: "20px", fontWeight: "bold", display: "block"}}>Home</Link>
         {myUsername && <Link to={`/profile/${myUsername}`} style={{marginTop: "15px", fontSize: "20px", fontWeight: "bold", display: "block"}}>Profile</Link>}
      </div>

      <div className="main-content">
        {/* Sticky Header Top */}
        <div style={{padding: "15px 20px", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", zIndex: 1}}>
          <h3 style={{margin: 0}}>{profile.fullname}</h3>
          <span style={{color: "var(--text-secondary)", fontSize: "14px"}}>{posts.length} posts</span>
        </div>

        {/* Profile Header Details */}
        <div style={{padding: "20px", borderBottom: "1px solid var(--border-color)"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
             <div style={{width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "var(--border-color)", border: "4px solid var(--bg-color)", marginTop: "-10px"}} />
             {profile._id !== myUserId && (
                <button 
                  onClick={handleFollow}
                  className="btn-outline" 
                  style={{backgroundColor: profile.followers.includes(myUserId) ? "transparent" : "var(--text-primary)", color: profile.followers.includes(myUserId) ? "var(--text-primary)" : "var(--bg-color)"}}
                >
                  {profile.followers.includes(myUserId) ? "Unfollow" : "Follow"}
                </button>
             )}
          </div>
          
          <div style={{marginTop: "15px"}}>
            <p style={{fontWeight: "bold", fontSize: "20px"}}>{profile.fullname}</p>
            <p style={{color: "var(--text-secondary)"}}>@{profile.username}</p>
          </div>

          {profile.bio && <p style={{marginTop: "15px"}}>{profile.bio}</p>}

          <div style={{display: "flex", gap: "20px", marginTop: "15px", color: "var(--text-secondary)"}}>
            <span><strong style={{color:"var(--text-primary)"}}>{profile.following.length}</strong> Following</span>
            <span><strong style={{color:"var(--text-primary)"}}>{profile.followers.length}</strong> Followers</span>
          </div>
        </div>

        {/* Users Posts Feed */}
        {posts.map(post => (
           <div key={post._id} style={{padding: "20px", borderBottom: "1px solid var(--border-color)"}}>
              <div style={{display: "flex", gap: "12px"}}>
                 <div style={{width: "48px", height: "48px", backgroundColor: "#333", borderRadius: "50%", flexShrink: 0}} />
                 <div style={{width: "100%"}}>
                    <span style={{fontWeight: "bold", marginRight: "5px"}}>{post.user.fullname}</span>
                    <span style={{color: "var(--text-secondary)"}}>@{post.user.username}</span>
                    <p style={{marginTop: "8px", fontSize: "15px", lineHeight: "1.5"}}>{post.text}</p>
                    <div style={{display:"flex", gap:"30px", marginTop:"12px", color: "var(--text-secondary)"}}>
                        <span>💬 {post.comments.length}</span>
                        <span>❤️ {post.likes.length}</span>
                    </div>
                 </div>
              </div>
           </div>
        ))}
      </div>
    </div>
  )
}
