class Post < ApplicationRecord
  belongs_to :user
  
  # Associations for social features
  has_many :comments, dependent: :destroy
  has_many :likes, as: :likeable, dependent: :destroy
  
  # Active Storage for post images
  has_one_attached :image
  
  # Validations
  validates :content, presence: true
end
