class Post < ApplicationRecord
  belongs_to :user
  
  # Associations for social features
  has_many :comments, dependent: :destroy
  has_many :likes, as: :likeable, dependent: :destroy
  
  # Active Storage for post images
  has_one_attached :image
  
  # Notifications
  has_many :notifications, as: :notifiable, dependent: :destroy
  
  # Validations
  validates :content, presence: true
  
  # Image validations
  validate :acceptable_image, if: -> { image.attached? }
  
  private
  
  def acceptable_image
    # Check file size
    if image.blob.byte_size > 5.megabytes
      errors.add(:image, "is too large (maximum is 5MB)")
      image.purge # Remove the invalid attachment
    end
    
    # Check file type
    acceptable_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    unless acceptable_types.include?(image.blob.content_type)
      errors.add(:image, "must be a JPEG, PNG, GIF or WEBP")
      image.purge # Remove the invalid attachment
    end
  end
end
