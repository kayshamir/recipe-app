import { fireEvent, render } from '@testing-library/react-native';
import { Button } from '../foundation';
import { it, expect, jest } from '@jest/globals';
it('provides an accessible action and prevents interaction when disabled', async () => {
  const onPress = jest.fn();
  const view = await render(<Button label="Continue" onPress={onPress} />);
  await fireEvent.press(view.getByRole('button', { name: 'Continue' }));
  expect(onPress).toHaveBeenCalledTimes(1);
  await view.rerender(<Button label="Continue" onPress={onPress} disabled />);
  await fireEvent.press(view.getByRole('button', { name: 'Continue' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
