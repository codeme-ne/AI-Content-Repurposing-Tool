import type { MouseEvent } from 'react'
import { PLATFORM_META, type Platform } from '@/config/platforms'
import { PlatformPreviewCard } from '@/components/common/PlatformPreviewCard'
import {
  ExtractingContent,
  GeneratingPosts,
} from '@/components/common/SkeletonLoaders'
import type { ExtractionStage } from '@/api/extract'
import type { GeneratedPost } from '@/hooks/usePostGeneratorState'

interface GeneratedPostsPanelProps {
  postsByPlatform: Record<Platform, GeneratedPost[]>
  isExtracting: boolean
  extractionProgress: number
  extractionStage: ExtractionStage | 'idle'
  isGeneratingAny: boolean
  generationCurrentPlatform: Platform | null
  isEditing: boolean
  editingPlatform?: Platform
  editingIndex?: number
  editingContent: string
  onEditContentChange: (value: string) => void
  onStartEdit: (platform: Platform, index: number, content: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onSavePost: (content: string, platform: Platform, sourceElement?: HTMLElement | null) => void
  onShareLinkedIn?: (content: string) => void
}

export function GeneratedPostsPanel({
  postsByPlatform,
  isExtracting,
  extractionProgress,
  extractionStage,
  isGeneratingAny,
  generationCurrentPlatform,
  isEditing,
  editingPlatform,
  editingIndex,
  editingContent,
  onEditContentChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onSavePost,
  onShareLinkedIn,
}: GeneratedPostsPanelProps) {
  const hasContent = Object.values(postsByPlatform).some((posts) => posts.length > 0)
  const isLoading = isExtracting || isGeneratingAny

  return (
    <div className="relative min-h-[400px] w-full">
      {isExtracting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm">
          <ExtractingContent progress={extractionProgress} extractionStage={extractionStage} />
        </div>
      )}

      {isGeneratingAny && generationCurrentPlatform && !isExtracting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm">
          <GeneratingPosts platform={generationCurrentPlatform} />
        </div>
      )}

      <div className={`space-y-6 transition-opacity duration-300 ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
        {(['linkedin', 'x', 'instagram'] as Platform[]).map((platform) => {
          const items = postsByPlatform[platform] || []
          if (items.length === 0) return null

          const meta = PLATFORM_META[platform]

          return (
            <section key={platform} className="space-y-3" aria-label={`${meta.label} generierte Posts`}>
              <div className="flex items-center gap-2">
                <span aria-hidden>{meta.emoji}</span>
                <span className="text-sm font-semibold">{meta.label}</span>
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? 'Beitrag' : 'Beitraege'}
                </span>
              </div>

              <div className="space-y-4">
                {items.map((post, index) => {
                  const isEditingThis =
                    isEditing &&
                    editingPlatform === platform &&
                    editingIndex === index

                  return (
                    <PlatformPreviewCard
                      key={`${platform}-${index}`}
                      platform={platform}
                      content={post.content}
                      isEditing={isEditingThis}
                      editContent={editingContent}
                      onEditContentChange={onEditContentChange}
                      onStartEdit={() => onStartEdit(platform, index, post.content)}
                      onCancelEdit={onCancelEdit}
                      onSaveEdit={onSaveEdit}
                      onSave={(e: MouseEvent<HTMLButtonElement>) => {
                        const card = (e.currentTarget as HTMLElement).closest('[data-post-card]') as HTMLElement | null
                        onSavePost(post.content, platform, card)
                      }}
                      onShare={platform === 'linkedin' ? () => onShareLinkedIn?.(post.content) : undefined}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}

        {!hasContent && (
          <div className="py-16 text-center text-muted-foreground">
            <div className="mx-auto max-w-md space-y-4">
              <div className="flex justify-center gap-3">
                {(['linkedin', 'x', 'instagram'] as Platform[]).map((platform) => (
                  <div
                    key={platform}
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: `${PLATFORM_META[platform].color}10` }}
                  >
                    {PLATFORM_META[platform].emoji}
                  </div>
                ))}
              </div>
              <h3 className="text-lg font-medium text-foreground">Bereit fuer deinen ersten Post</h3>
              <p className="text-sm">Fuege Content hinzu und waehle eine Plattform aus.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
