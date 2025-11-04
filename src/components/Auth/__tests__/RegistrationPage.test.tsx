import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { RegistrationPage } from '../RegistrationPage';
import { authService } from '../../../services/authService';

jest.mock('../../../services/authService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RegistrationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render registration form', () => {
    renderWithRouter(<RegistrationPage />);

    expect(screen.getByText(/VideoCodage Tool/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegistrationPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, '12345');
    await user.type(confirmPasswordInput, '12345');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegistrationPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should successfully register a new user', async () => {
    const mockResponse = {
      success: true,
      user: { id: 1, username: 'testuser' },
    };

    (authService.register as jest.Mock).mockResolvedValue(mockResponse);

    const user = userEvent.setup();
    renderWithRouter(<RegistrationPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  it('should display error message on registration failure', async () => {
    const mockError = {
      response: {
        data: { error: 'Username already exists' },
      },
    };

    (authService.register as jest.Mock).mockRejectedValue(mockError);

    const user = userEvent.setup();
    renderWithRouter(<RegistrationPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    await user.type(usernameInput, 'existinguser');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegistrationPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    (authService.register as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/registering/i)).toBeInTheDocument();
  });
});

