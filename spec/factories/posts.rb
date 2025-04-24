FactoryBot.define do
  factory :post do
    content { Faker::Lorem.paragraph(sentence_count: 2, supplemental: false) }
    association :user
  end
end
