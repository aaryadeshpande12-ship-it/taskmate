import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './StudentManagementApp';

test('renders the student directory', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /student directory/i })).toBeInTheDocument();
  expect(screen.getByText('Ava Rodriguez')).toBeInTheDocument();
});

test('filters students by search query', async () => {
  render(<App />);
  await userEvent.type(screen.getByRole('textbox', { name: /search students/i }), 'Maya');
  expect(screen.getByText('Maya Patel')).toBeInTheDocument();
  expect(screen.queryByText('Ava Rodriguez')).not.toBeInTheDocument();
});

test('adds a student through the form', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /add student/i }));
  await userEvent.type(screen.getByLabelText('Full name'), 'Sam Lee');
  await userEvent.type(screen.getByLabelText('Email address'), 'sam@xyzacademy.edu');
  await userEvent.click(screen.getAllByRole('button', { name: /add student/i })[1]);
  expect(screen.getByText('Sam Lee')).toBeInTheDocument();
});

test('updates a student attendance status', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /attendance/i }));
  const status = screen.getByLabelText('Attendance status for Ava Rodriguez');
  await userEvent.selectOptions(status, 'Absent');
  expect(status).toHaveValue('Absent');
  expect(screen.getByRole('heading', { name: /daily attendance/i })).toBeInTheDocument();
});
