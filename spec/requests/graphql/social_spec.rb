require 'rails_helper'

RSpec.describe 'Social GraphQL API', type: :request do
  let(:current_user) { create(:user) }
  let(:context) { { current_user: current_user } }
  
  describe 'mutations' do
    describe 'createPost' do
      let(:query) do
        <<~GQL
          mutation CreatePost($content: String!) {
            createPost(content: $content) {
              post {
                id
                content
                user {
                  id
                  fullName
                }
              }
              errors
            }
          }
        GQL
      end
      
      it 'creates a new post when authenticated' do
        variables = { content: "Just shot my best round ever at Pebble Beach!" }
        
        expect {
          result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
          data = result.to_h['data']['createPost']
          
          expect(data['post']['content']).to eq(variables[:content])
          expect(data['post']['user']['id']).to eq(current_user.id.to_s)
          expect(data['errors']).to be_empty
        }.to change(Post, :count).by(1)
      end
      
      it 'returns an error when not authenticated' do
        variables = { content: "Just shot my best round ever at Pebble Beach!" }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: { current_user: nil })
        data = result.to_h['data']['createPost']
        
        expect(data['post']).to be_nil
        expect(data['errors']).to include('You need to be logged in to create a post')
      end
      
      it 'validates post content' do
        variables = { content: "" }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['createPost']
        
        expect(data['post']).to be_nil
        expect(data['errors']).to include("Content can't be blank")
      end
    end
    
    describe 'createComment' do
      let(:post) { create(:post) }
      let(:query) do
        <<~GQL
          mutation CreateComment($postId: ID!, $content: String!) {
            createComment(postId: $postId, content: $content) {
              comment {
                id
                content
                user {
                  id
                  fullName
                }
              }
              errors
            }
          }
        GQL
      end
      
      it 'creates a new comment when authenticated' do
        variables = { 
          postId: post.id,
          content: "Great shot! What clubs are you using?"
        }
        
        expect {
          result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
          data = result.to_h['data']['createComment']
          
          expect(data['comment']['content']).to eq(variables[:content])
          expect(data['comment']['user']['id']).to eq(current_user.id.to_s)
          expect(data['errors']).to be_empty
        }.to change(Comment, :count).by(1)
      end
      
      it 'returns an error for non-existent posts' do
        variables = { 
          postId: 'non-existent-id',
          content: "Great shot! What clubs are you using?"
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['createComment']
        
        expect(data['comment']).to be_nil
        expect(data['errors']).to include('Post not found')
      end
    end
    
    describe 'toggleLike' do
      let(:post) { create(:post) }
      let(:query) do
        <<~GQL
          mutation ToggleLike($likeableId: ID!, $likeableType: String!) {
            toggleLike(likeableId: $likeableId, likeableType: $likeableType) {
              liked
              errors
            }
          }
        GQL
      end
      
      it 'creates a like when none exists' do
        variables = { 
          likeableId: post.id,
          likeableType: 'Post'
        }
        
        expect {
          result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
          data = result.to_h['data']['toggleLike']
          
          expect(data['liked']).to be true
          expect(data['errors']).to be_empty
        }.to change(Like, :count).by(1)
      end
      
      it 'removes a like when one already exists' do
        # Create a like first
        create(:like, user: current_user, likeable: post)
        
        variables = { 
          likeableId: post.id,
          likeableType: 'Post'
        }
        
        expect {
          result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
          data = result.to_h['data']['toggleLike']
          
          expect(data['liked']).to be false
          expect(data['errors']).to be_empty
        }.to change(Like, :count).by(-1)
      end
      
      it 'supports liking comments as well' do
        comment = create(:comment)
        variables = { 
          likeableId: comment.id,
          likeableType: 'Comment'
        }
        
        expect {
          result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
          data = result.to_h['data']['toggleLike']
          
          expect(data['liked']).to be true
          expect(data['errors']).to be_empty
        }.to change(Like, :count).by(1)
      end
    end
  end
end
