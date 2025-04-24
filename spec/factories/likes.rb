FactoryBot.define do
  factory :like do
    association :user
    
    # Since likeable is polymorphic, provide traits for different likeable types
    trait :for_post do
      association :likeable, factory: :post
    end
    
    trait :for_comment do
      association :likeable, factory: :comment
    end
  end
end
