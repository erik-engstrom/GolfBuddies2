require 'rails_helper'

RSpec.describe 'Buddy System GraphQL API', type: :request do
  let(:current_user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:context) { { current_user: current_user } }
  
  describe 'mutations' do
    describe 'sendBuddyRequest' do
      let(:query) do
        <<~GQL
          mutation SendBuddyRequest($receiverId: ID!) {
            sendBuddyRequest(receiverId: $receiverId) {
              buddyRequest {
                id
                status
                sender {
                  id
                  fullName
                }
                receiver {
                  id
                  fullName
                }
              }
              errors
            }
          }
        GQL
      end
      
      it 'creates a new buddy request when authenticated' do
        variables = { receiverId: other_user.id }
        
        expect {
          result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
          data = result.to_h['data']['sendBuddyRequest']
          
          expect(data['buddyRequest']['status']).to eq('pending')
          expect(data['buddyRequest']['sender']['id']).to eq(current_user.id.to_s)
          expect(data['buddyRequest']['receiver']['id']).to eq(other_user.id.to_s)
          expect(data['errors']).to be_empty
        }.to change(BuddyRequest, :count).by(1)
      end
      
      it 'prevents self-requests' do
        variables = { receiverId: current_user.id }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['sendBuddyRequest']
        
        expect(data['buddyRequest']).to be_nil
        expect(data['errors']).to include("Can't send buddy request to yourself")
      end
      
      it 'prevents duplicate pending requests' do
        # Create a pending request first
        create(:buddy_request, sender: current_user, receiver: other_user, status: 'pending')
        
        variables = { receiverId: other_user.id }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['sendBuddyRequest']
        
        expect(data['buddyRequest']).to be_nil
        expect(data['errors']).to include('A pending buddy request already exists')
      end
    end
    
    describe 'respondToBuddyRequest' do
      let(:query) do
        <<~GQL
          mutation RespondToBuddyRequest($buddyRequestId: ID!, $accept: Boolean!) {
            respondToBuddyRequest(buddyRequestId: $buddyRequestId, accept: $accept) {
              buddyRequest {
                id
                status
                sender {
                  id
                  fullName
                }
                receiver {
                  id
                  fullName
                }
              }
              errors
            }
          }
        GQL
      end
      
      let!(:buddy_request) { create(:buddy_request, sender: other_user, receiver: current_user, status: 'pending') }
      
      it 'accepts a buddy request' do
        variables = { 
          buddyRequestId: buddy_request.id,
          accept: true
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['respondToBuddyRequest']
        
        expect(data['buddyRequest']['status']).to eq('accepted')
        expect(data['errors']).to be_empty
        
        # Verify the record was updated in the database
        expect(buddy_request.reload.status).to eq('accepted')
      end
      
      it 'declines a buddy request' do
        variables = { 
          buddyRequestId: buddy_request.id,
          accept: false
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['respondToBuddyRequest']
        
        expect(data['buddyRequest']['status']).to eq('declined')
        expect(data['errors']).to be_empty
        
        # Verify the record was updated in the database
        expect(buddy_request.reload.status).to eq('declined')
      end
      
      it 'prevents responding to someone else\'s request' do
        # Create a request where current_user is not the receiver
        someone_elses_request = create(:buddy_request, sender: other_user, receiver: create(:user))
        
        variables = { 
          buddyRequestId: someone_elses_request.id,
          accept: true
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['respondToBuddyRequest']
        
        expect(data['buddyRequest']).to be_nil
        expect(data['errors']).to include('You can only respond to your own buddy requests')
      end
      
      it 'prevents responding to already processed requests' do
        # Set the request to already accepted
        buddy_request.update(status: 'accepted')
        
        variables = { 
          buddyRequestId: buddy_request.id,
          accept: true
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['respondToBuddyRequest']
        
        expect(data['buddyRequest']).to be_nil
        expect(data['errors']).to include('This buddy request has already been processed')
      end
    end
    
    describe 'queries' do
      describe 'buddies' do
        let(:query) do
          <<~GQL
            query {
              buddies {
                id
                fullName
                handicap
                playingStyle
              }
            }
          GQL
        end
        
        it 'returns a list of confirmed buddies' do
          # Create some buddy relationships with different statuses
          buddy1 = create(:user)
          buddy2 = create(:user)
          non_buddy = create(:user)
          
          create(:buddy_request, sender: current_user, receiver: buddy1, status: 'accepted')
          create(:buddy_request, sender: buddy2, receiver: current_user, status: 'accepted')
          create(:buddy_request, sender: current_user, receiver: non_buddy, status: 'pending')
          
          result = GolfBuddies2Schema.execute(query, context: context)
          buddies = result.to_h['data']['buddies']
          
          expect(buddies.length).to eq(2)
          buddy_ids = buddies.map { |b| b['id'] }
          expect(buddy_ids).to include(buddy1.id.to_s, buddy2.id.to_s)
          expect(buddy_ids).not_to include(non_buddy.id.to_s)
        end
      end
    end
  end
end
