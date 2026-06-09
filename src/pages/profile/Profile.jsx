import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [myUsername, setMyUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/auth/me").then(res=>res.json()).then(data=>{
      if(data._id) {
         setMyUserId(data._id);
         setMyUsername(data.username);
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setProfile(null);
    setPosts([]);
    
    Promise.all([
      apiFetch(`/api/users/profile/${username}`).then(res => res.json()),
      apiFetch(`/api/posts/user/${username}`).then(res => res.json())
    ])
    .then(([profileData, postsData]) => {
      if (profileData._id) setProfile(profileData);
      if (postsData.posts) setPosts(postsData.posts);
    })
    .catch(err => {
      console.error("Error loading profile details:", err);
    })
    .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    if (!myUserId) return;
    try {
      const res = await apiFetch(`/api/users/follow/${profile._id}`, {
        method: "POST"
      });
      if (res.ok) {
        const followers = profile.followers || [];
        const isFollowing = followers.includes(myUserId);
        const updatedFollowers = isFollowing 
            ? followers.filter(id => id !== myUserId)
            : [...followers, myUserId];
            
        setProfile({ ...profile, followers: updatedFollowers });
      }
    } catch(e) { console.error(e) }
  }

  if (loading) return <div style={{padding: "20px"}}>Loading...</div>;
  if (!profile) return <div style={{padding: "20px"}}>User not found</div>;

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
         <h2>X Clone</h2>
         <Link to="/" className="sidebar-link">🏠 Home</Link>
         {myUsername && <Link to={`/profile/${myUsername}`} className="sidebar-link">👤 Profile</Link>}
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
          <div className="profile-avatar" />
          {myUserId && profile._id !== myUserId && (
             <button 
               onClick={handleFollow}
               className="btn-outline" 
               style={{
                 backgroundColor: (profile.followers || []).includes(myUserId) ? "transparent" : "var(--text-primary)", 
                 color: (profile.followers || []).includes(myUserId) ? "var(--text-primary)" : "var(--bg-color)"
               }}
             >
               {(profile.followers || []).includes(myUserId) ? "Unfollow" : "Follow"}
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
            <span><strong className="profile-stat-val">{profile.following.length}</strong> Following</span>
            <span><strong className="profile-stat-val">{profile.followers.length}</strong> Followers</span>
          </div>
        </div>

        {/* Users Posts Feed */}
        {posts.map(post => (
           <div key={post._id} className="post-card">
              <div style={{display: "flex", gap: "12px"}}>
                 <div className="post-avatar" />
                 <div style={{width: "100%"}}>
                    <div className="post-header">
                       <span className="post-author">{post.user.fullname}</span>
                       <span className="post-username">@{post.user.username}</span>
                    </div>
                    <p className="post-text">{post.text}</p>
                    <div className="interaction-bar">
                        <div className="interaction-icon">💬 {post.comments.length}</div>
                        <div className="interaction-icon">❤️ {post.likes.length}</div>
                    </div>
                 </div>
              </div>
           </div>
        ))}
      </div>
    </div>
  )
}
