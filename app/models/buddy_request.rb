class BuddyRequest < ApplicationRecord
  # Associations
  belongs_to :sender, class_name: 'User'
  belongs_to :receiver, class_name: 'User'
  
  # Enums
  enum :status, { pending: 'pending', accepted: 'accepted', declined: 'declined' }
  
  # Validations
  validates :status, inclusion: { in: statuses.keys }
  validate :not_self_request
  
  private
  
  def not_self_request
    if sender_id == receiver_id
      errors.add(:receiver_id, "can't be the same as sender")
    end
  end
end
