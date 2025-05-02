class Like < ApplicationRecord
  belongs_to :user
  belongs_to :likeable, polymorphic: true
  
  # Notifications
  has_many :notifications, as: :notifiable, dependent: :destroy
  
  after_create :create_notification
  
  private
  
  def create_notification
    # Don't create a notification if the user likes their own content
    return if user_id == likeable_owner_id
    
    Notification.create!(
      user_id: likeable_owner_id, 
      notifiable: self,
      action: "like"
    )
  end
  
  def likeable_owner_id
    case likeable_type
    when "Post"
      likeable.user_id
    when "Comment"
      likeable.user_id
    end
  end
end
