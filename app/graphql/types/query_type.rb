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
    field :current_user, Types::UserType, null: true, description: "Returns the currently authenticated user"
    field :user, Types::UserType, null: true, description: "Returns a user by ID" do
      argument :id, ID, required: true
    end
    field :users, [Types::UserType], null: false, description: "Returns a list of users"

    # Post queries
    field :post, Types::PostType, null: true, description: "Returns a post by ID" do
      argument :id, ID, required: true
    end
    field :posts, [Types::PostType], null: false, description: "Returns a list of posts" do
      argument :buddy_only, Boolean, required: false, description: "If true, only returns posts from buddies"
    end
    
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
    
    def current_user
      context[:current_user]
    end

    def user(id:)
      User.find_by(id: id)
    end

    def users
      User.all
    end

    def post(id:)
      post = Post.find_by(id: id)
      
      # Return nil if post doesn't exist
      return nil unless post
      
      # If post is buddy-only, check that the current user has permission to view it
      if post.buddy_only
        # Allow the post owner to see their own buddy-only post
        return post if context[:current_user] && context[:current_user].id == post.user_id
        
        # Allow buddies to see buddy-only posts
        return post if context[:current_user] && context[:current_user].buddies.exists?(post.user_id)
        
        # Otherwise restrict access to buddy-only posts
        return nil
      end
      
      # Non-buddy-only posts are accessible to everyone
      post
    end

    def posts(buddy_only: false)
      base_query = Post.includes(:user, :comments, :likes).order(created_at: :desc)
      
      # If we have a current user, filter buddy-only posts to ensure they're only visible to buddies
      if context[:current_user]
        # Get the IDs of the current user's buddies
        buddy_ids = context[:current_user].buddies.pluck(:id)
        # Include the current user's ID as well, as they should see their own buddy-only posts
        buddy_ids << context[:current_user].id
        
        puts "Current user ID: #{context[:current_user].id}, Buddy IDs: #{buddy_ids.inspect}"
        
        # Apply filters based on the buddy_only parameter
        if buddy_only
          # When buddy_only is true, show only buddy-only posts from the user's buddies
          # (as well as the user's own buddy-only posts)
          base_query = base_query.where(user_id: buddy_ids).where(buddy_only: true)
          puts "BUDDY ONLY FEED - SQL: #{base_query.to_sql}"
        else
          # When showing all posts, show only public posts (not buddy-only)
          # regardless of who posted them
          filtered_query = base_query.where(buddy_only: false)
          puts "ALL POSTS FEED - SQL: #{filtered_query.to_sql}"
          base_query = filtered_query
        end
      else
        # If no user is logged in, only show public posts (not buddy-only)
        base_query = base_query.where(buddy_only: false)
        puts "NO USER - SQL: #{base_query.to_sql}"
      end
      
      base_query
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