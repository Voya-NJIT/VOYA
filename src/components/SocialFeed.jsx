import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function SocialFeed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ caption: '', imageFile: null, imagePreview: '' });
  const [modal, setModal] = useState({ show: false, message: '', type: 'info' });
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setModal({ show: true, message: 'Please select an image file', type: 'info' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setModal({ show: true, message: 'Image must be less than 10MB', type: 'info' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setNewPost({ ...newPost, imageFile: file, imagePreview: e.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleCreatePost = async () => {
    if (!newPost.imageFile) {
      setModal({ show: true, message: 'Please select an image', type: 'info' });
      return;
    }

    setUploading(true);

    try {
      // Upload image first
      const formData = new FormData();
      formData.append('image', newPost.imageFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { imageUrl } = await uploadResponse.json();

      // Create post with uploaded image URL
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          caption: newPost.caption,
          imageUrl: imageUrl
        })
      });

      if (response.ok) {
        setNewPost({ caption: '', imageFile: null, imagePreview: '' });
        setShowCreatePost(false);
        loadPosts();
        setModal({ show: true, message: 'Post created successfully!', type: 'info' });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setModal({ show: true, message: 'Failed to create post', type: 'info' });
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (response.ok) {
        loadPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    setModal({
      show: true,
      message: 'Are you sure you want to delete this post?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          });

          if (response.ok) {
            loadPosts();
            setModal({ show: true, message: 'Post deleted', type: 'info' });
          } else {
            setModal({ show: true, message: 'Failed to delete post', type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting post:', error);
          setModal({ show: true, message: 'Failed to delete post', type: 'info' });
        }
      }
    });
  };

  return (
    <div className="social-feed">
      <div className="social-header">
        <h2>Social Feed</h2>
        <button 
          className="create-post-btn"
          onClick={() => setShowCreatePost(!showCreatePost)}
        >
          {showCreatePost ? 'Cancel' : '+ Create Post'}
        </button>
      </div>

      {showCreatePost && (
        <div className="create-post-form">
          <h3>Create New Post</h3>
          
          <div 
            className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            {newPost.imagePreview ? (
              <div className="image-preview">
                <img src={newPost.imagePreview} alt="Preview" />
                <button 
                  className="remove-image-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewPost({ ...newPost, imageFile: null, imagePreview: '' });
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">+</div>
                <p>Drag and drop an image here</p>
                <p className="upload-hint">or click to browse</p>
              </div>
            )}
          </div>
          
          <input
            id="file-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          
          <textarea
            placeholder="Write a caption..."
            value={newPost.caption}
            onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
            rows="3"
          />
          
          <button 
            onClick={handleCreatePost}
            disabled={uploading || !newPost.imageFile}
          >
            {uploading ? 'Uploading...' : 'Post'}
          </button>
        </div>
      )}

      <div className="posts-container">
        {posts.length === 0 ? (
          <p className="no-posts">No posts yet. Be the first to share your trip!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-user-info">
                  {post.user?.profilePicture ? (
                    <img 
                      src={post.user.profilePicture} 
                      alt={post.user.name}
                      className="user-avatar-img"
                    />
                  ) : (
                    <div className="user-avatar">{post.user?.name?.[0] || '?'}</div>
                  )}
                  <div>
                    <div className="post-username">{post.user?.name || 'Unknown'}</div>
                    <div className="post-date">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {post.userId === currentUser.id && (
                  <button 
                    className="delete-post-btn"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="post-image">
                <img src={post.imageUrl} alt="Post" onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                }} />
              </div>

              <div className="post-actions">
                <button 
                  className={`like-btn ${post.likes?.includes(currentUser.id) ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  Like {post.likes?.length || 0}
                </button>
              </div>

              {post.caption && (
                <div className="post-caption">
                  <span className="caption-username">{post.user?.name}</span> {post.caption}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {modal.show && (
        <Modal
          message={modal.message}
          type={modal.type}
          onClose={() => setModal({ show: false, message: '', type: 'info' })}
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
}
