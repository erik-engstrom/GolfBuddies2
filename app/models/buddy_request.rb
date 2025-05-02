class BuddyRequest < ApplicationRecord
  # Associations
  belongs_to :sender, class_name: 'User'
  belongs_to :receiver, class_name: 'User'
  
  # Notifications
  has_many :notifications, as: :notifiable, dependent: :destroy
  
  # Enums
  enum :status, { pending: 'pending', accepted: 'accepted', declined: 'declined' }
  
  # Validations
  validates :status, inclusion: { in: statuses.keys }
  validate :not_self_request
  
  after_create :create_notification
  
  private
  
  def not_self_request
    if sender_id == receiver_id
      errors.add(:receiver_id, "can't be the same as sender")
    end
  end

  def create_notification
    # Create a notification for the receiver of the buddy request
    Notification.create!(
      user_id: receiver_id,
      notifiable: self,
      action: "buddy_request"
    )
  end
end
