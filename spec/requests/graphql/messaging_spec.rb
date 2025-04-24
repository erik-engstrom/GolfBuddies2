require 'rails_helper'

RSpec.describe 'Messaging GraphQL API', type: :request do
  let(:current_user) { create(:user) }
  let(:buddy_user) { create(:user) }
  let(:non_buddy_user) { create(:user) }
  let(:context) { { current_user: current_user } }
  
  before do
    # Create a buddy relationship between current_user and buddy_user
    create(:buddy_request, sender: current_user, receiver: buddy_user, status: 'accepted')
  end
  
  describe 'mutations' do
    describe 'sendMessage' do
      let(:query) do
        <<~GQL
          mutation SendMessage($receiverId: ID!, $content: String!) {
            sendMessage(receiverId: $receiverId, content: $content) {
              message {
                id
                content
                read
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
      
      it 'creates a new message when sending to a buddy' do
        variables = { 
          receiverId: buddy_user.id,
          content: "Hey, want to play golf this weekend?"
        }
        
        expect {
          result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
          data = result.to_h['data']['sendMessage']
          
          expect(data['message']['content']).to eq(variables[:content])
          expect(data['message']['read']).to be false
          expect(data['message']['sender']['id']).to eq(current_user.id.to_s)
          expect(data['message']['receiver']['id']).to eq(buddy_user.id.to_s)
          expect(data['errors']).to be_empty
        }.to change(Message, :count).by(1)
      end
      
      it 'prevents sending messages to non-buddies' do
        variables = { 
          receiverId: non_buddy_user.id,
          content: "Hey, want to play golf this weekend?"
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['sendMessage']
        
        expect(data['message']).to be_nil
        expect(data['errors']).to include('You can only message users who are your buddies')
      end
      
      it 'validates message content' do
        variables = { 
          receiverId: buddy_user.id,
          content: ""
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['sendMessage']
        
        expect(data['message']).to be_nil
        expect(data['errors']).to include("Content can't be blank")
      end
    end
    
    describe 'markMessageAsRead' do
      let(:message) { create(:message, sender: buddy_user, receiver: current_user, read: false) }
      let(:query) do
        <<~GQL
          mutation MarkMessageAsRead($messageId: ID!) {
            markMessageAsRead(messageId: $messageId) {
              message {
                id
                read
              }
              errors
            }
          }
        GQL
      end
      
      it 'marks a message as read' do
        variables = { messageId: message.id }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['markMessageAsRead']
        
        expect(data['message']['read']).to be true
        expect(data['errors']).to be_empty
        
        # Verify the message was updated in the database
        expect(message.reload.read).to be true
      end
      
      it 'prevents marking someone else\'s messages as read' do
        # Create a message where current_user is not the receiver
        someone_elses_message = create(:message, sender: buddy_user, receiver: non_buddy_user)
        
        variables = { messageId: someone_elses_message.id }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        data = result.to_h['data']['markMessageAsRead']
        
        expect(data['message']).to be_nil
        expect(data['errors']).to include('You can only mark your own messages as read')
      end
    end
  end
  
  describe 'queries' do
    describe 'messagesWithUser' do
      let(:query) do
        <<~GQL
          query MessagesWithUser($userId: ID!) {
            messagesWithUser(userId: $userId) {
              id
              content
              read
              createdAt
              sender {
                id
                fullName
              }
              receiver {
                id
                fullName
              }
            }
          }
        GQL
      end
      
      before do
        # Create some messages between current_user and buddy_user
        create(:message, sender: current_user, receiver: buddy_user, content: "Hey, want to play golf?")
        create(:message, sender: buddy_user, receiver: current_user, content: "Sure! When were you thinking?")
        create(:message, sender: current_user, receiver: buddy_user, content: "How about Saturday morning?")
        
        # Create a message to another user that shouldn't be included
        other_buddy = create(:user)
        create(:buddy_request, sender: current_user, receiver: other_buddy, status: 'accepted')
        create(:message, sender: current_user, receiver: other_buddy)
      end
      
      it 'returns messages between the current user and specified user' do
        variables = { userId: buddy_user.id }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        messages = result.to_h['data']['messagesWithUser']
        
        expect(messages.length).to eq(3)
        
        # Check that all messages are between current_user and buddy_user
        messages.each do |message|
          sender_id = message['sender']['id']
          receiver_id = message['receiver']['id']
          
          expect([sender_id, receiver_id]).to contain_exactly(current_user.id.to_s, buddy_user.id.to_s)
        end
        
        # Check message contents
        message_contents = messages.map { |m| m['content'] }
        expect(message_contents).to include(
          "Hey, want to play golf?",
          "Sure! When were you thinking?",
          "How about Saturday morning?"
        )
      end
      
      it 'returns an empty array for non-buddies' do
        variables = { userId: non_buddy_user.id }
        
        result = GolfBuddies2Schema.execute(query, variables: variables, context: context)
        messages = result.to_h['data']['messagesWithUser']
        
        expect(messages).to eq([])
      end
    end
  end
end
