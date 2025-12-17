import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function ProfilePage({ currentUser, onUserUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    bio: currentUser.bio || '',
    hometown: currentUser.hometown || '',
    age: currentUser.age || ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState(currentUser.profilePicture || null);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    setProfile({
      bio: currentUser.bio || '',
      hometown: currentUser.hometown || '',
      age: currentUser.age || ''
    });
    setPicturePreview(currentUser.profilePicture || null);
  }, [currentUser]);

  const handlePictureSelect = (file) => {
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
      setProfilePicture(file);
      setPicturePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setUploading(true);
    
    try {
      let profilePictureUrl = currentUser.profilePicture;

      // Upload profile picture if changed
      if (profilePicture) {
        const formData = new FormData();
        formData.append('image', profilePicture);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload profile picture');
        }

        const { imageUrl } = await uploadResponse.json();
        profilePictureUrl = imageUrl;
      }

      // Update profile
      const response = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: profile.bio,
          hometown: profile.hometown,
          age: profile.age ? parseInt(profile.age) : null,
          profilePicture: profilePictureUrl
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUserUpdate(updatedUser);
        setIsEditing(false);
        setProfilePicture(null);
        setModal({ show: true, message: 'Profile updated successfully!', type: 'info' });
      } else {
        setModal({ show: true, message: 'Failed to update profile', type: 'info' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setModal({ show: true, message: 'Failed to update profile', type: 'info' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setProfile({
      bio: currentUser.bio || '',
      hometown: currentUser.hometown || '',
      age: currentUser.age || ''
    });
    setProfilePicture(null);
    setPicturePreview(currentUser.profilePicture || null);
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>My Profile</h2>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-picture-container">
            {picturePreview ? (
              <img src={picturePreview} alt="Profile" className="profile-picture-large" />
            ) : (
              <div className="profile-avatar-large">
                {currentUser.name[0].toUpperCase()}
              </div>
            )}
            
            {isEditing && (
              <div className="profile-picture-edit">
                <input
                  id="profile-picture-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handlePictureSelect(e.target.files[0])}
                />
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => document.getElementById('profile-picture-input').click()}
                >
                  Change Picture
                </button>
              </div>
            )}
          </div>
          
          <div className="profile-info-section">
            <h3>{currentUser.name}</h3>
            <p className="profile-address">{currentUser.address}</p>
          </div>

          <div className="profile-details">
            <div className="profile-field">
              <label>Hometown</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.hometown}
                  onChange={(e) => setProfile({ ...profile, hometown: e.target.value })}
                  placeholder="Enter your hometown"
                />
              ) : (
                <p>{currentUser.hometown || 'Not set'}</p>
              )}
            </div>

            <div className="profile-field">
              <label>Age</label>
              {isEditing ? (
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                />
              ) : (
                <p>{currentUser.age || 'Not set'}</p>
              )}
            </div>

            <div className="profile-field">
              <label>Bio</label>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows="4"
                />
              ) : (
                <p className="profile-bio">{currentUser.bio || 'No bio yet'}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="profile-actions">
              <button className="btn btn-secondary" onClick={handleCancel} disabled={uploading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={uploading}>
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {modal.show && (
        <Modal
          message={modal.message}
          type={modal.type}
          onClose={() => setModal({ show: false, message: '', type: 'info' })}
        />
      )}
    </div>
  );
}
