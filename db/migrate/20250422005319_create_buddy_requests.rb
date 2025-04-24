class CreateBuddyRequests < ActiveRecord::Migration[8.0]
  def change
    create_table :buddy_requests do |t|
      t.string :status, default: 'pending'
      t.references :sender, null: false, foreign_key: { to_table: :users }
      t.references :receiver, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
    
    add_index :buddy_requests, [:sender_id, :receiver_id], unique: true
  end
end
