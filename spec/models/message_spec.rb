require 'rails_helper'

RSpec.describe Message, type: :model do
  # Associations
  describe 'associations' do
    it { should belong_to(:sender).class_name('User') }
    it { should belong_to(:receiver).class_name('User') }
  end

  # Validations
  describe 'validations' do
    it { should validate_presence_of(:content) }
    
    describe 'buddy relationship validation' do
      let(:user1) { create(:user) }
      let(:user2) { create(:user) }
      let(:user3) { create(:user) }
      
      before do
        create(:buddy_request, sender: user1, receiver: user2, status: 'accepted')
      end
      
      it 'allows messages between users who are buddies' do
        message = build(:message, sender: user1, receiver: user2)
        expect(message).to be_valid
      end
      
      it 'prevents messages between users who are not buddies' do
        message = build(:message, sender: user1, receiver: user3)
        
        # Skip the factory's automatic buddy request creation
        allow(BuddyRequest).to receive(:exists?).and_return(false)
        
        expect(message).not_to be_valid
        expect(message.errors[:base]).to include("You can only message users who are your buddies")
      end
    end
  end
  
  # Instance methods
  describe 'instance methods' do
    describe '#mark_as_read' do
      let(:message) { create(:message, read: false) }
      
      it 'marks the message as read' do
        message.mark_as_read
        expect(message.read).to be true
      end
    end
  end
end
