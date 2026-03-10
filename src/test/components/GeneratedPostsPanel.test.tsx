import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { GeneratedPostsPanel } from '@/components/common/GeneratedPostsPanel'
import type { Platform } from '@/config/platforms'
import type { GeneratedPost } from '@/hooks/usePostGeneratorState'

function createPost(platform: Platform, content: string): GeneratedPost {
  return {
    content,
    platform,
    isEdited: false,
    regenerationCount: 0,
    createdAt: new Date('2026-03-10T00:00:00.000Z'),
    characterCount: content.length,
  }
}

function renderPanel() {
  return render(
    <GeneratedPostsPanel
      postsByPlatform={{
        linkedin: [createPost('linkedin', 'LinkedIn body copy')],
        x: [createPost('x', 'X post copy')],
        instagram: [createPost('instagram', 'Instagram caption copy')],
      }}
      isExtracting={false}
      extractionProgress={0}
      extractionStage="idle"
      isGeneratingAny={false}
      generationCurrentPlatform={null}
      isEditing={false}
      editingContent=""
      onEditContentChange={vi.fn()}
      onStartEdit={vi.fn()}
      onCancelEdit={vi.fn()}
      onSaveEdit={vi.fn()}
      onSavePost={vi.fn()}
      onShareLinkedIn={vi.fn()}
    />
  )
}

describe('GeneratedPostsPanel', () => {
  test('renders platform sections without fake social meta text', () => {
    renderPanel()

    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()

    expect(screen.queryByText(/^Du$/)).not.toBeInTheDocument()
    expect(screen.queryByText('Gerade eben')).not.toBeInTheDocument()
    expect(screen.queryByText('@dein_handle')).not.toBeInTheDocument()
    expect(screen.queryByText('dein_username')).not.toBeInTheDocument()
    expect(screen.queryByText(/Post #1/i)).not.toBeInTheDocument()
  })

  test('uses icon-only actions with accessible labels', () => {
    renderPanel()

    expect(screen.queryByText('Kopieren')).not.toBeInTheDocument()
    expect(screen.queryByText('Bearbeiten')).not.toBeInTheDocument()

    expect(screen.getAllByRole('button', { name: 'Kopieren' })).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: 'Bearbeiten' })).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Auf LinkedIn teilen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Auf X teilen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Auf Instagram teilen' })).toBeInTheDocument()
  })
})
