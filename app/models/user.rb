class User < ApplicationRecord
  has_secure_password
  
  # Enums
  enum :playing_style, { fun: 'fun', competitive: 'competitive', social: 'social' }
  
  # Post and comment associations
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :likes, dependent: :destroy
  
  # Buddy system associations
  has_many :sent_buddy_requests, class_name: 'BuddyRequest', foreign_key: 'sender_id', dependent: :destroy
  has_many :received_buddy_requests, class_name: 'BuddyRequest', foreign_key: 'receiver_id', dependent: :destroy
  
  # Direct messaging associations
  has_many :sent_messages, class_name: 'Message', foreign_key: 'sender_id', dependent: :destroy
  has_many :received_messages, class_name: 'Message', foreign_key: 'receiver_id', dependent: :destroy
  
  # Validations
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, :last_name, presence: true
  validates :handicap, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 54 }, allow_nil: true
  validates :playing_style, inclusion: { in: playing_styles.keys }, allow_nil: true
  
  # Active Storage for profile picture
  has_one_attached :profile_picture
  
  # Helper methods for the buddy system
  def buddies
    accepted_sent = BuddyRequest.where(sender: self, status: 'accepted').includes(:receiver).map(&:receiver)
    accepted_received = BuddyRequest.where(receiver: self, status: 'accepted').includes(:sender).map(&:sender)
    accepted_sent + accepted_received
  end
  
  def buddy_with?(user)
    buddies.include?(user)
  end
  
  def unread_messages_count
    received_messages.where(read: false).count
  end

  # Returns a hash: { buddy_id => count }
  def unread_messages_count_by_buddy
    received_messages.where(read: false)
      .group(:sender_id)
      .count
  end
  
  # Helper method for displaying user's full name
  def full_name
    "#{first_name} #{last_name}"
  end
end
