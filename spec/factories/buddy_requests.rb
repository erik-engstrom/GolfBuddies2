FactoryBot.define do
  factory :buddy_request do
    association :sender, factory: :user
    association :receiver, factory: :user
    status { 'pending' }
    
    trait :accepted do
      status { 'accepted' }
    end
    
    trait :declined do
      status { 'declined' }
    end
  end
end
