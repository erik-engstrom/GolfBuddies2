# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [Types::NodeType, null: true], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ID], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # User queries
    field :me, Types::UserType, null: true, description: "Returns the currently authenticated user"
    field :user, Types::UserType, null: true, description: "Returns a user by ID" do
      argument :id, ID, required: true
    end
    field :users, [Types::UserType], null: false, description: "Returns a list of users"

    # Post queries
    field :post, Types::PostType, null: true, description: "Returns a post by ID" do
      argument :id, ID, required: true
    end
    field :posts, [Types::PostType], null: false, description: "Returns a list of posts"
    
    # Buddy system queries
    field :buddies, [Types::UserType], null: false, description: "Returns a list of the current user's buddies"
    field :buddy_requests, [Types::BuddyRequestType], null: false, description: "Returns a list of the current user's buddy requests"
    
    # Messaging queries
    field :messages_with_user, [Types::MessageType], null: false, description: "Returns messages between the current user and another user" do
      argument :user_id, ID, required: true
    end
    
    # Search queries
    field :search_users, [Types::UserType], null: false, description: "Search for users by name" do
      argument :query, String, required: true
    end

    def me
      context[:current_user]
    end

    def user(id:)
      User.find_by(id: id)
    end

    def users
      User.all
    end

    def post(id:)
      Post.find_by(id: id)
    end

    def posts
      Post.includes(:user, :comments, :likes).order(created_at: :desc)
    end

    def buddies
      if context[:current_user]
        context[:current_user].buddies
      else
        []
      end
    end

    def buddy_requests
      if context[:current_user]
        BuddyRequest.where(
          "sender_id = :user_id OR receiver_id = :user_id", 
          user_id: context[:current_user].id
        )
      else
        []
      end
    end

    def messages_with_user(user_id:)
      if context[:current_user]
        Message.where(
          "(sender_id = :current_user_id AND receiver_id = :user_id) OR
           (sender_id = :user_id AND receiver_id = :current_user_id)",
          current_user_id: context[:current_user].id,
          user_id: user_id
        ).order(created_at: :asc)
      else
        []
      end
    end
    
    def search_users(query:)
      return [] if query.blank? || !context[:current_user]
      
      # Search for users by first_name, last_name, or the combination (full_name)
      # Using ILIKE for case-insensitive search (for PostgreSQL)
      # You might need to change it to LIKE if using MySQL or other databases
      search_term = "%#{query.downcase}%"
      
      User.where("LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?", search_term, search_term)
          .or(User.where("LOWER(CONCAT(first_name, ' ', last_name)) LIKE ?", search_term))
          .where.not(id: context[:current_user].id) # Exclude the current user from results
          .limit(20) # Limit the number of results for performance
    end
    
    # TODO: remove me
    field :test_field, String, null: false,
      description: "An example field added by the generator"
    def test_field
      "Hello World!"
    end
  end
end