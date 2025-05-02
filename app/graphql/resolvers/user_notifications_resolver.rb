module Resolvers
  class UserNotificationsResolver < GraphQL::Schema::Resolver
    type [Types::NotificationType], null: false
    
    def resolve
      object.notifications.order(created_at: :desc)
    end
  end
  
  class UserUnreadNotificationsCountResolver < GraphQL::Schema::Resolver
    type Integer, null: false
    
    def resolve
      object.notifications.unread.count
    end
  end
end
