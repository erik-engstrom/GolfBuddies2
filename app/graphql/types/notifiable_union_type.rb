module Types
  class NotifiableUnionType < Types::BaseUnion
    # Explicitly require the models to ensure they're loaded
    require_relative '../../models/post'
    require_relative '../../models/comment'
    require_relative '../../models/buddy_request'
    require_relative '../../models/like'
    
    possible_types Types::PostType, Types::CommentType, Types::BuddyRequestType, Types::LikeType
    
    def self.resolve_type(object, _context)
      case object
      when Post
        Types::PostType
      when Comment
        Types::CommentType
      when BuddyRequest
        Types::BuddyRequestType
      when Like
        Types::LikeType
      else
        if object.nil?
          nil
        else
          raise "Unexpected notifiable type: #{object.class}"
        end
      end
    end
  end
end
