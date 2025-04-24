FactoryBot.define do
  factory :comment do
    content { Faker::Lorem.sentence(word_count: 10) }
    association :user
    association :post
  end
end
