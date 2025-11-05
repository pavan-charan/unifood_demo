import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecommendationProvider, useRecommendations } from '../../contexts/RecommendationContext';
import { AppProvider } from '../../contexts/AppContext';
import { AuthProvider } from '../../contexts/AuthContext';

const TestComponent = () => {
  const { getProfileRecommendations, getCartRecommendations } = useRecommendations();
  return (
    <div>
      <div data-testid="profile-recommendations">{JSON.stringify(getProfileRecommendations())}</div>
      <div data-testid="cart-recommendations">{JSON.stringify(getCartRecommendations([]))}</div>
    </div>
  );
};

describe('RecommendationContext', () => {
  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <AppProvider>
          <RecommendationProvider>
            <TestComponent />
          </RecommendationProvider>
        </AppProvider>
      </AuthProvider>
    );
    expect(screen.getByTestId('profile-recommendations')).toBeInTheDocument();
    expect(screen.getByTestId('cart-recommendations')).toBeInTheDocument();
  });
});
