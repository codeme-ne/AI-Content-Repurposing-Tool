import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { CharacterCounterTextarea } from '@/components/common/CharacterCounter'

describe('CharacterCounterTextarea', () => {
  test('renders a minimal counter without helper copy or progress UI', () => {
    render(
      <CharacterCounterTextarea
        value="A short LinkedIn draft"
        platform="linkedin"
        mode="minimal"
        onChange={() => {}}
      />
    )

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByText('22/3000')).toBeInTheDocument()

    expect(screen.queryByText('Perfect length')).not.toBeInTheDocument()
    expect(screen.queryByText(/available/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Approaching limit/i)).not.toBeInTheDocument()
    expect(screen.queryByText('linkedin')).not.toBeInTheDocument()
  })
})
