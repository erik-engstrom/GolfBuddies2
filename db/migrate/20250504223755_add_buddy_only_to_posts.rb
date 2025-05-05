class AddBuddyOnlyToPosts < ActiveRecord::Migration[8.0]
  def change
    add_column :posts, :buddy_only, :boolean, default: false
  end
end
