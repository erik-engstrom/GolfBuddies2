class AddIndexesToPostLocation < ActiveRecord::Migration[8.0]
  def change
    add_index :posts, [:latitude, :longitude]
    add_index :posts, :city
    add_index :posts, :zip_code
  end
end
