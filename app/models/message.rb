class Message < ApplicationRecord
  # Associations
  belongs_to :sender, class_name: 'User'
  belongs_to :receiver, class_name: 'User'
  
  # Validations
  validates :content, presence: true
  validate :users_are_buddies
  
  private
  
  def users_are_buddies
    # Check if sender and receiver are confirmed buddies
    unless BuddyRequest.exists?(
      [
        { sender_id: sender_id, receiver_id: receiver_id, status: 'accepted' },
        { sender_id: receiver_id, receiver_id: sender_id, status: 'accepted' }
      ]
    )
      errors.add(:base, "You can only message users who are your buddies")
    end
  end
end
