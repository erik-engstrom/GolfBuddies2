require 'rails_helper'

RSpec.describe 'User GraphQL API', type: :request do
  let(:user) { create(:user) }
  let(:context) { { current_user: user } }
  
  describe 'queries' do
    describe 'me' do
      let(:query) do
        <<~GQL
          query {
            me {
              id
              email
              firstName
              lastName
              fullName
              handicap
              playingStyle
              unreadMessagesCount
            }
          }
        GQL
      end
      
      it 'returns the current user when authenticated' do
        # Create some unread messages to test the count
        other_user = create(:user)
        create(:buddy_request, sender: user, receiver: other_user, status: 'accepted')
        create_list(:message, 3, sender: other_user, receiver: user, read: false)
        
        result = GolfBuddies2Schema.execute(query, context: context)
        data = result.to_h['data']['me']
        
        expect(data['id']).to eq(user.id.to_s)
        expect(data['email']).to eq(user.email)
        expect(data['firstName']).to eq(user.first_name)
        expect(data['lastName']).to eq(user.last_name)
        expect(data['fullName']).to eq(user.full_name)
        expect(data['handicap']).to eq(user.handicap)
        expect(data['playingStyle']).to eq(user.playing_style)
        expect(data['unreadMessagesCount']).to eq(3)
      end
      
      it 'returns nil when not authenticated' do
        result = GolfBuddies2Schema.execute(query, context: { current_user: nil })
        
        expect(result.to_h['data']['me']).to be_nil
      end
    end
    
    describe 'user' do
      let(:other_user) { create(:user) }
      let(:query) do
        <<~GQL
          query($id: ID!) {
            user(id: $id) {
              id
              email
              firstName
              lastName
              fullName
              handicap
              playingStyle
            }
          }
        GQL
      end
      
      it 'returns the requested user' do
        result = GolfBuddies2Schema.execute(
          query, 
          context: context,
          variables: { id: other_user.id }
        )
        
        data = result.to_h['data']['user']
        
        expect(data['id']).to eq(other_user.id.to_s)
        expect(data['email']).to eq(other_user.email)
        expect(data['firstName']).to eq(other_user.first_name)
        expect(data['lastName']).to eq(other_user.last_name)
        expect(data['fullName']).to eq(other_user.full_name)
        expect(data['handicap']).to eq(other_user.handicap)
        expect(data['playingStyle']).to eq(other_user.playing_style)
      end
      
      it 'returns nil for a non-existent user' do
        result = GolfBuddies2Schema.execute(
          query, 
          context: context,
          variables: { id: 'non-existent-id' }
        )
        
        expect(result.to_h['data']['user']).to be_nil
      end
    end
  end
end
