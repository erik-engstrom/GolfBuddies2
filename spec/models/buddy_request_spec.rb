require 'rails_helper'

RSpec.describe BuddyRequest, type: :model do
  # Associations
  describe 'associations' do
    it { should belong_to(:sender).class_name('User') }
    it { should belong_to(:receiver).class_name('User') }
  end

  # Validations
  describe 'validations' do
    it { should validate_inclusion_of(:status).in_array(BuddyRequest.statuses.keys) }
    
    it 'validates that users cannot send buddy requests to themselves' do
      user = create(:user)
      buddy_request = build(:buddy_request, sender: user, receiver: user)
      
      expect(buddy_request).not_to be_valid
      expect(buddy_request.errors[:receiver_id]).to include("can't be the same as sender")
    end
    
    describe 'duplicate requests' do
      let(:user1) { create(:user) }
      let(:user2) { create(:user) }
      
      it 'does not allow duplicate pending requests in the same direction' do
        create(:buddy_request, sender: user1, receiver: user2, status: 'pending')
        duplicate = build(:buddy_request, sender: user1, receiver: user2)
        
        expect(duplicate).not_to be_valid
      end
      
      it 'allows new request after the previous one was declined' do
        create(:buddy_request, sender: user1, receiver: user2, status: 'declined')
        new_request = build(:buddy_request, sender: user1, receiver: user2)
        
        expect(new_request).to be_valid
      end
    end
  end
  
  # Enum
  describe 'enums' do
    it { should define_enum_for(:status).with_values(pending: 'pending', accepted: 'accepted', declined: 'declined') }
  end
end
