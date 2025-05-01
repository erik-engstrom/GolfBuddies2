# GolfBuddies

A social networking application designed specifically for golfers, allowing them to connect with fellow players, share their golfing experiences, and coordinate meetups.

![Golf Buddies Logo](/public/icon.svg)

## 📖 Table of Contents

- [Features](#-features)
- [Technologies](#-technologies)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Development](#-development)
- [Database Setup](#-database-setup)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **User Profiles**: Create personalized profiles with handicap, playing style, and profile pictures
- **Buddy System**: Connect with other golfers by sending buddy requests
- **Real-time Messaging**: Chat with your buddies through a real-time messaging system
- **Feed**: Share posts, images, and updates with your network
- **Interactions**: Like and comment on posts to engage with the community
- **Responsive Design**: Fully mobile-friendly interface for on-the-go access

## 🛠️ Technologies

- **Frontend**:
  - React 
  - Apollo Client for GraphQL
  - TailwindCSS for styling
  - Real-time subscriptions

- **Backend**:
  - Ruby on Rails
  - GraphQL API
  - ActionCable for WebSocket connections
  - ActiveStorage for file uploads

- **Database**:
  - PostgreSQL

- **Testing**:
  - RSpec for backend testing
  - Jest for frontend testing

## 🚀 Getting Started

### Prerequisites

- Ruby 3.2.2 or higher
- Rails 7.0 or higher
- PostgreSQL
- Node.js 16+ and Yarn
- Redis (for ActionCable)

### 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/golfbuddies.git
   cd golfbuddies
   ```

2. Install Ruby dependencies:
   ```bash
   bundle install
   ```

3. Install JavaScript dependencies:
   ```bash
   yarn install
   ```

4. Set up environment variables:
   - Create a `.env` file based on the `.env.example`
   - Configure your database credentials

## 💻 Development

1. Start the Rails server and frontend development server:
   ```bash
   bin/dev
   ```

2. Access the application at `http://localhost:3000`

For a smoother development experience, you can run the components separately:

```bash
# Rails server
bin/rails server

# Tailwind CSS processing
bin/rails tailwindcss:watch

# JavaScript bundling (esbuild)
yarn build --watch
```

## 🗄️ Database Setup

1. Create and set up the database:
   ```bash
   bin/rails db:create
   bin/rails db:migrate
   ```

2. Load sample data (optional):
   ```bash
   bin/rails db:seed
   ```

## 🧪 Testing

### Running Backend Tests

```bash
bundle exec rspec
```

### Running Frontend Tests

```bash
yarn test
```

## 🚢 Deployment

The application is optimized for deployment on platforms like Heroku, Render, or Fly.io:

```bash
# Example for Heroku
heroku create
git push heroku main
heroku run rails db:migrate
```

## 🏛️ Project Structure

```
app/
  assets/             # Static assets and stylesheets
  channels/           # ActionCable channels for real-time features
  controllers/        # Rails controllers
  graphql/            # GraphQL API (types, mutations, resolvers)
  javascript/         # React components and frontend code
    components/       # React components
    graphql/          # Apollo Client setup and GraphQL operations
  models/             # ActiveRecord models
  views/              # Rails views (used minimally)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ⛳ by [Your Name]
