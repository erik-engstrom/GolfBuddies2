require 'rails_helper'

RSpec.describe Post, type: :model do
  # Associations
  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:comments).dependent(:destroy) }
    it { should have_many(:likes).dependent(:destroy) }
    it { should have_one_attached(:image) }
  end

  # Validations
  describe 'validations' do
    it { should validate_presence_of(:content) }
  end

  # Methods
  describe '#comments_count' do
    let(:post) { create(:post) }

    it 'returns the number of comments on the post' do
      create_list(:comment, 3, post: post)
      
      expect(post.comments.count).to eq(3)
    end
  end

  describe '#likes_count' do
    let(:post) { create(:post) }

    it 'returns the number of likes on the post' do
      create_list(:like, 5, likeable: post)
      
      expect(post.likes.count).to eq(5)
    end
  end
end
