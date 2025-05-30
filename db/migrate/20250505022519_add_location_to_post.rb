class AddLocationToPost < ActiveRecord::Migration[8.0]
  def change
    add_column :posts, :latitude, :float
    add_column :posts, :longitude, :float
    add_column :posts, :address, :string
    add_column :posts, :city, :string
    add_column :posts, :state, :string
    add_column :posts, :zip_code, :string
    add_column :posts, :country, :string
  end
end
