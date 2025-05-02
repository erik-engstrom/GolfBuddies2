class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :post
  
  # Likes association
  has_many :likes, as: :likeable, dependent: :destroy
  
  # Notifications
  has_many :notifications, as: :notifiable, dependent: :destroy
  
  # Validations
  validates :content, presence: true
  
  after_create :create_notification
  
  private
  
  def create_notification
    # Don't create a notification if the user comments on their own post
    return if user_id == post.user_id
    
    Notification.create!(
      user_id: post.user_id,
      notifiable: self,
      action: "comment"
    )
  end
end
