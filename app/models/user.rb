class User < ApplicationRecord
  has_secure_password
  
  # Enums
  enum :playing_style, { fun: 'fun', competitive: 'competitive', social: 'social' }
  
  # Geocoding configuration
  geocoded_by :full_address
  reverse_geocoded_by :latitude, :longitude do |obj, results|
    if geo = results.first
      obj.address = geo.address
      obj.city = geo.city
      obj.state = geo.state
      obj.zip_code = geo.postal_code
      obj.country = geo.country
    end
  end
  
  # Callbacks for geocoding
  after_validation :geocode, if: ->(obj) { 
    obj.address_changed? || obj.city_changed? || obj.state_changed? || obj.zip_code_changed? || obj.country_changed? 
  }
  after_validation :reverse_geocode, if: ->(obj) { obj.latitude_changed? || obj.longitude_changed? }
  
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
    # Calculate the total count directly from unread_messages_count_by_buddy
    # to ensure consistency between the total and per-buddy counts
    unread_messages_count_by_buddy.values.sum
  end

  # Returns a hash: { buddy_id => count }
  def unread_messages_count_by_buddy
    received_messages.where(read: false)
      .group(:sender_id)
      .count
  end
  
  # Location helper methods
  def full_address
    [address, city, state, zip_code, country].compact.join(', ')
  end
  
  # Notifications
  has_many :notifications, dependent: :destroy
  
  # Helper method for displaying user's full name
  def full_name
    "#{first_name} #{last_name}"
  end
  
  def unread_notifications_count
    notifications.unread.count
  end
end
