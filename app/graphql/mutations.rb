# This file explicitly loads all the mutation classes to ensure they're available
# We want to be absolutely sure all the mutation classes are loaded into Rails autoloader

# Authentication mutations
require_relative "mutations/sign_up"
require_relative "mutations/sign_in"
require_relative "mutations/logout"
require_relative "mutations/refresh_token"

# Post mutations
require_relative "mutations/create_post"
require_relative "mutations/update_post"
require_relative "mutations/delete_post"
require_relative "mutations/create_comment"
require_relative "mutations/toggle_like"

# Buddy system mutations
require_relative "mutations/send_buddy_request"
require_relative "mutations/respond_to_buddy_request"

# Messaging mutations
require_relative "mutations/send_message"
require_relative "mutations/mark_message_as_read"
require_relative "mutations/mark_all_messages_as_read"

# File upload mutations
require_relative "mutations/update_profile_picture"
require_relative "mutations/add_post_image"

# Notification mutations
require_relative "mutations/mark_notification_as_read"
require_relative "mutations/mark_all_notifications_as_read"
