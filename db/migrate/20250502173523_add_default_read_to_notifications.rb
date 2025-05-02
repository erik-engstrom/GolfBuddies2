class AddDefaultReadToNotifications < ActiveRecord::Migration[8.0]
  def change
    change_column_default :notifications, :read, false
    
    # Update existing records with nil read values
    execute <<-SQL
      UPDATE notifications 
      SET read = FALSE 
      WHERE read IS NULL
    SQL
  end
end
