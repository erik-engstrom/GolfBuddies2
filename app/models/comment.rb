class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :post
  
  # Likes association
  has_many :likes, as: :likeable, dependent: :destroy
  
  # Validations
  validates :content, presence: true
end
