import React, { useState, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_POST_MUTATION, ADD_POST_IMAGE_MUTATION } from '../../graphql/mutations';
import { GET_FEED_POSTS } from '../../graphql/queries';

const PostForm = ({ refetchPosts }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [buddyOnly, setBuddyOnly] = useState(false);
  const fileInputRef = useRef(null);

  const [createPost, { loading }] = useMutation(CREATE_POST_MUTATION, {
    refetchQueries: [{ 
      query: GET_FEED_POSTS, 
      fetchPolicy: 'network-only',
      variables: { buddyOnly: false } // Always show all posts after creating a new one
    }], // Force refetch posts after creation
    onCompleted: (data) => {
      // If we have an image to upload and post creation was successful, attach the image
      if (image && data.createPost.post) {
        addPostImage({
          variables: {
            post_id: data.createPost.post.id,
            image: image
          },
          onCompleted: (imageData) => {
            if (imageData.addPostImage.errors.length > 0) {
              setError(`Failed to upload image: ${imageData.addPostImage.errors.join(', ')}`);
              setIsUploading(false);
            } else {
              // Image uploaded successfully
              console.log("Image uploaded successfully:", imageData.addPostImage.post.imageUrl);
              // Force a refetch to ensure we get the updated data
              refetchPosts && refetchPosts();
              setIsUploading(false);
              resetForm(); // Reset the form only once here
            }
          },
          onError: (error) => {
            console.error('Image upload error:', error);
            // Log more details to help with debugging
            if (error.graphQLErrors) {
              console.error('GraphQL errors:', error.graphQLErrors);
            }
            if (error.networkError) {
              console.error('Network error:', error.networkError);
            }
            setError(`Failed to upload image: ${error.message}`);
            setIsUploading(false);
          }
        });
      } else {
        // If no image to upload, just reset the form
        setIsUploading(false);
        resetForm(); // Reset the form only once here
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsUploading(false);
    }
  });

  const [addPostImage] = useMutation(ADD_POST_IMAGE_MUTATION, {
    refetchQueries: [{ 
      query: GET_FEED_POSTS, 
      fetchPolicy: 'network-only',
      variables: { buddyOnly: false } // Always show all posts after adding an image
    }],
    // Force a refetch from network to ensure fresh data
    awaitRefetchQueries: true, // This ensures we wait for the refetch to complete
    onError: (error) => {
      setError(`Failed to upload image: ${error.message}`);
      setIsUploading(false);
    }
  });

  const resetForm = () => {
    // Clear text content
    setContent('');
    
    // Clear image data
    setImage(null);
    setImagePreview(null);
    
    // Reset upload state
    setIsUploading(false);
    
    // Reset buddy-only state
    setBuddyOnly(false);
    
    // Clear error messages
    setError('');
    
    // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Add a short delay for visual feedback that the post was submitted
    setTimeout(() => {
      // Scroll the textarea back to top if it was scrolled
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.scrollTop = 0;
      }
    }, 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    // Clear any previous errors
    setError('');
    
    // Set uploading state to show feedback to user
    setIsUploading(true);
    
    // Submit the post with buddyOnly flag
    createPost({ 
      variables: { content, buddyOnly }
      // We're now handling the cache updates directly in the mutation's update function
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should not exceed 5MB');
      e.target.value = '';
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
      e.target.value = '';
      return;
    }

    setImage(file);
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-fairway-800 mb-4">Share your golf experience</h2>
      
      {error && (
        <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fairway-500"
          placeholder="What's happening on the course today?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          disabled={isUploading}
        />
        

        
        {/* Image preview area */}
        {imagePreview && (
          <div className="mt-4 relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-60 rounded-lg object-contain bg-gray-100"
            />
            <button 
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 focus:outline-none"
              disabled={isUploading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Buddy-only checkbox with clean design */}
        <div className="bg-fairway-50 border border-fairway-200 p-3 rounded-lg my-4 flex items-center">
          <input
            type="checkbox"
            id="buddy-only"
            className="mr-3 h-5 w-5 text-fairway-600 focus:ring-fairway-500 border-gray-300 rounded"
            checked={buddyOnly}
            onChange={(e) => setBuddyOnly(e.target.checked)}
            disabled={isUploading}
          />
          <div>
            <label htmlFor="buddy-only" className="font-medium text-fairway-800">
              Buddy Only Post
            </label>
            <p className="text-sm text-gray-600 mt-0.5">
              This post will only be visible in the "Buddy-Only Posts" feed and only to your golf buddies. 
              It will not appear in the public feed.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-3">
            <input 
              type="file" 
              id="image-upload"
              className="hidden"
              onChange={handleImageChange}
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/gif,image/webp"
              disabled={isUploading}
            />
            <label 
              htmlFor="image-upload" 
              className={`flex items-center cursor-pointer px-3 py-2 rounded-md text-fairway-600 hover:bg-fairway-50 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add Photo
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isUploading || loading}
            className={`px-4 py-2 rounded-md ${
              isUploading || loading ? 'bg-gray-400' : 'bg-fairway-600 hover:bg-fairway-700'
            } text-white font-medium`}
          >
            {isUploading || loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
