module Mutations
  class ToggleLike < BaseMutation
    # Define what our mutation returns
    field :likeable, GraphQL::Types::JSON, null: true
    field :liked, Boolean, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :likeable_id, ID, required: true
    argument :likeable_type, String, required: true

    def resolve(likeable_id:, likeable_type:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          likeable: nil,
          liked: nil,
          errors: ["You need to be logged in to like content"]
        }
      end

      # Find the likeable object (Post or Comment)
      likeable = nil
      case likeable_type
      when "Post"
        likeable = Post.find_by(id: likeable_id)
      when "Comment"
        likeable = Comment.find_by(id: likeable_id)
      else
        return {
          likeable: nil,
          liked: nil,
          errors: ["Invalid likeable type"]
        }
      end
      
      unless likeable
        return {
          likeable: nil,
          liked: nil,
          errors: ["Content not found"]
        }
      end

      # Check if user already liked this content
      existing_like = Like.find_by(
        user_id: context[:current_user].id,
        likeable_id: likeable.id,
        likeable_type: likeable_type
      )

      if existing_like
        # If already liked, unlike it
        existing_like.destroy
        {
          likeable: { id: likeable.id, type: likeable_type },
          liked: false,
          errors: []
        }
      else
        # If not liked, add a like
        like = Like.new(
          user: context[:current_user],
          likeable: likeable
        )

        if like.save
          {
            likeable: { id: likeable.id, type: likeable_type },
            liked: true,
            errors: []
          }
        else
          {
            likeable: nil,
            liked: nil,
            errors: like.errors.full_messages
          }
        end
      end
    end
  end
end
