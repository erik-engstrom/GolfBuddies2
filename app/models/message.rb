class Message < ApplicationRecord
  # Associations
  belongs_to :sender, class_name: 'User'
  belongs_to :receiver, class_name: 'User'
  
  # Validations
  validates :content, presence: true
  validate :users_are_buddies
  
  private
  
  def users_are_buddies
    sender_id_int = sender_id.to_i
    receiver_id_int = receiver_id.to_i

    Rails.logger.debug "Checking buddy relationship: sender_id=#{sender_id_int}, receiver_id=#{receiver_id_int}"

    exists = BuddyRequest.where(sender_id: sender_id_int, receiver_id: receiver_id_int, status: 'accepted')
                         .or(BuddyRequest.where(sender_id: receiver_id_int, receiver_id: sender_id_int, status: 'accepted'))
                         .exists?

    Rails.logger.debug "Buddy relationship exists? #{exists}"

    unless exists
      errors.add(:base, "You can only message users who are your buddies")
    end
  end
end
