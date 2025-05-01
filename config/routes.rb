Rails.application.routes.draw do
  # GraphQL API endpoint
  post "/graphql", to: "graphql#execute"
  
  # Mount ActionCable for WebSockets
  mount ActionCable.server => "/cable"
  
  # Mount GraphiQL in development
  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql"
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Set the root path and route all other paths to the SPA
  root "pages#home"
  get "login", to: "pages#home"
  get "signup", to: "pages#home"
  get "*path", to: "pages#home", constraints: ->(request) {
    !request.xhr? && request.format.html?
  }
end
