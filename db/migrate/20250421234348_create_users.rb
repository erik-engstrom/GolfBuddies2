class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email
      t.string :first_name
      t.string :last_name
      t.decimal :handicap
      t.string :playing_style
      t.string :password_digest

      t.timestamps
    end
    add_index :users, :email, unique: true
  end
end
