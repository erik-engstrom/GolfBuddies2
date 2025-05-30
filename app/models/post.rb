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
  
  # Location helper methods
  def full_address
    [address, city, state, zip_code, country].compact.join(', ')
  end
  
  # Search by location methods
  def self.near_coordinates(latitude, longitude, distance_in_miles = 10)
    near([latitude, longitude], distance_in_miles)
  end
  
  def self.in_city(city_name)
    where("lower(city) = ?", city_name.downcase)
  end
  
  def self.in_zip_code(zip)
    where(zip_code: zip)
  end
  
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
