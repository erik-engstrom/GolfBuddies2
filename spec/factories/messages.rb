FactoryBot.define do
  factory :message do
    content { Faker::Lorem.paragraph(sentence_count: 1) }
    association :sender, factory: :user
    association :receiver, factory: :user
    read { false }
    
    trait :read do
      read { true }
    end
    
    # This is needed to pass validation that users are buddies
    after(:build) do |message|
      unless BuddyRequest.exists?(
        [
          { sender_id: message.sender_id, receiver_id: message.receiver_id, status: 'accepted' },
          { sender_id: message.receiver_id, receiver_id: message.sender_id, status: 'accepted' }
        ]
      )
        create(:buddy_request, sender: message.sender, receiver: message.receiver, status: 'accepted')
      end
    end
  end
end
