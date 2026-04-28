import { fireEvent, render, screen } from '@testing-library/react';
import MoodSelector from './MoodSelector';

describe('MoodSelector', () => {
  it('shows an error when submitted with empty input', () => {
    const onMoodSelect = jest.fn();

    render(<MoodSelector onMoodSelect={onMoodSelect} />);

    const input = screen.getByLabelText(/enter mood or vibe/i);
    const form = input.closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);

    expect(screen.getByText(/please enter a mood or vibe/i)).toBeInTheDocument();
    expect(onMoodSelect).not.toHaveBeenCalled();
  });

  it('calls onMoodSelect with a trimmed mood and clears input', () => {
    const onMoodSelect = jest.fn();

    render(<MoodSelector onMoodSelect={onMoodSelect} />);

    const input = screen.getByLabelText(/enter mood or vibe/i);
    fireEvent.change(input, { target: { value: '  chill lo-fi  ' } });
    fireEvent.click(screen.getByRole('button', { name: /set/i }));

    expect(onMoodSelect).toHaveBeenCalledWith('chill lo-fi');
    expect(input).toHaveValue('');
    expect(screen.queryByText(/please enter a mood or vibe/i)).not.toBeInTheDocument();
  });

  it('disables submit button for blank or whitespace input', () => {
    render(<MoodSelector onMoodSelect={jest.fn()} />);

    const button = screen.getByRole('button', { name: /set/i });
    const input = screen.getByLabelText(/enter mood or vibe/i);

    expect(button).toBeDisabled();
    fireEvent.change(input, { target: { value: '   ' } });
    expect(button).toBeDisabled();
    fireEvent.change(input, { target: { value: 'focus' } });
    expect(button).toBeEnabled();
  });

  it('renders current selected mood when provided', () => {
    render(<MoodSelector onMoodSelect={jest.fn()} selectedMood="nostalgic" />);

    expect(screen.getByText(/currently playing:/i)).toBeInTheDocument();
    expect(screen.getByText('nostalgic')).toBeInTheDocument();
  });
});