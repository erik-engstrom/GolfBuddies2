require 'rails_helper'

RSpec.describe User, type: :model do
  # Associations
  describe 'associations' do
    it { should have_many(:posts).dependent(:destroy) }
    it { should have_many(:comments).dependent(:destroy) }
    it { should have_many(:likes).dependent(:destroy) }
    it { should have_many(:sent_buddy_requests).class_name('BuddyRequest').with_foreign_key('sender_id').dependent(:destroy) }
    it { should have_many(:received_buddy_requests).class_name('BuddyRequest').with_foreign_key('receiver_id').dependent(:destroy) }
    it { should have_many(:sent_messages).class_name('Message').with_foreign_key('sender_id').dependent(:destroy) }
    it { should have_many(:received_messages).class_name('Message').with_foreign_key('receiver_id').dependent(:destroy) }
    it { should have_one_attached(:profile_picture) }
  end

  # Validations
  describe 'validations' do
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email) }
    it { should validate_presence_of(:first_name) }
    it { should validate_presence_of(:last_name) }
    it { should allow_value(nil).for(:handicap) }
    it { should validate_numericality_of(:handicap).is_greater_than_or_equal_to(0).is_less_than_or_equal_to(54).allow_nil }
    it { should define_enum_for(:playing_style).with_values(fun: 'fun', competitive: 'competitive', social: 'social') }
  end

  # Methods
  describe '#buddies' do
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:user3) { create(:user) }
    
    before do
      create(:buddy_request, sender: user1, receiver: user2, status: 'accepted')
      create(:buddy_request, sender: user3, receiver: user1, status: 'accepted')
      # Not accepted, shouldn't be included
      create(:buddy_request, sender: user1, receiver: user3, status: 'pending')
    end
    
    it 'returns users with accepted buddy requests' do
      expect(user1.buddies).to include(user2, user3)
      expect(user1.buddies.count).to eq(2)
    end
  end
  
  describe '#buddy_with?' do
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:user3) { create(:user) }
    
    before do
      create(:buddy_request, sender: user1, receiver: user2, status: 'accepted')
    end
    
    it 'returns true for users who are buddies' do
      expect(user1.buddy_with?(user2)).to be true
      expect(user2.buddy_with?(user1)).to be true
    end
    
    it 'returns false for users who are not buddies' do
      expect(user1.buddy_with?(user3)).to be false
    end
  end
  
  describe '#unread_messages_count' do
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    
    before do
      create(:buddy_request, sender: user1, receiver: user2, status: 'accepted')
      create(:message, sender: user2, receiver: user1, read: false)
      create(:message, sender: user2, receiver: user1, read: false)
      create(:message, sender: user2, receiver: user1, read: true)
    end
    
    it 'returns the count of unread messages' do
      expect(user1.unread_messages_count).to eq(2)
    end
  end
  
  describe '#full_name' do
    let(:user) { build(:user, first_name: 'John', last_name: 'Doe') }
    
    it 'returns the combined first and last name' do
      expect(user.full_name).to eq('John Doe')
    end
  end
end
