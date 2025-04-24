require 'rails_helper'

RSpec.describe 'Authentication GraphQL API', type: :request do
  describe 'mutations' do
    describe 'signUp' do
      let(:query) do
        <<~GQL
          mutation SignUp(
            $email: String!
            $password: String!
            $passwordConfirmation: String!
            $firstName: String!
            $lastName: String!
            $handicap: Float
            $playingStyle: String
          ) {
            signUp(
              email: $email
              password: $password
              passwordConfirmation: $passwordConfirmation
              firstName: $firstName
              lastName: $lastName
              handicap: $handicap
              playingStyle: $playingStyle
            ) {
              token
              user {
                id
                email
                fullName
              }
              errors
            }
          }
        GQL
      end
      
      let(:variables) do
        {
          email: 'test@example.com',
          password: 'password123',
          passwordConfirmation: 'password123',
          firstName: 'Test',
          lastName: 'User',
          handicap: 12.5,
          playingStyle: 'fun'
        }
      end
      
      it 'creates a new user and returns a token' do
        expect {
          result = GolfBuddies2Schema.execute(query, variables: variables)
          data = result.to_h['data']['signUp']
          
          expect(data['token']).to be_present
          expect(data['user']['email']).to eq('test@example.com')
          expect(data['user']['fullName']).to eq('Test User')
          expect(data['errors']).to be_empty
        }.to change(User, :count).by(1)
      end
      
      it 'validates password confirmation' do
        variables[:passwordConfirmation] = 'wrong_password'
        
        result = GolfBuddies2Schema.execute(query, variables: variables)
        data = result.to_h['data']['signUp']
        
        expect(data['token']).to be_nil
        expect(data['user']).to be_nil
        expect(data['errors']).to include("Password confirmation doesn't match Password")
      end
      
      it 'validates email uniqueness' do
        # Create user with the same email first
        create(:user, email: 'test@example.com')
        
        result = GolfBuddies2Schema.execute(query, variables: variables)
        data = result.to_h['data']['signUp']
        
        expect(data['token']).to be_nil
        expect(data['user']).to be_nil
        expect(data['errors']).to include('Email has already been taken')
      end
    end
    
    describe 'signIn' do
      let(:query) do
        <<~GQL
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              token
              user {
                id
                email
                fullName
              }
              errors
            }
          }
        GQL
      end
      
      let!(:user) { create(:user, email: 'existing@example.com', password: 'correct_password') }
      
      it 'returns a token when credentials are valid' do
        variables = {
          email: 'existing@example.com',
          password: 'correct_password'
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables)
        data = result.to_h['data']['signIn']
        
        expect(data['token']).to be_present
        expect(data['user']['email']).to eq('existing@example.com')
        expect(data['errors']).to be_empty
      end
      
      it 'returns an error with invalid credentials' do
        variables = {
          email: 'existing@example.com',
          password: 'wrong_password'
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables)
        data = result.to_h['data']['signIn']
        
        expect(data['token']).to be_nil
        expect(data['user']).to be_nil
        expect(data['errors']).to include('Invalid email or password')
      end
      
      it 'returns an error for non-existent users' do
        variables = {
          email: 'nonexistent@example.com',
          password: 'any_password'
        }
        
        result = GolfBuddies2Schema.execute(query, variables: variables)
        data = result.to_h['data']['signIn']
        
        expect(data['token']).to be_nil
        expect(data['user']).to be_nil
        expect(data['errors']).to include('Invalid email or password')
      end
    end
  end
end
