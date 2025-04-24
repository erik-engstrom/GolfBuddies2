FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "password123" }
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    handicap { rand(0..54) }
    playing_style { User.playing_styles.keys.sample }
  end
end
