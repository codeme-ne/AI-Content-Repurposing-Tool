import { useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { useContentGeneration } from '@/hooks/useContentGeneration'
import type { Platform } from '@/config/platforms'

interface PlatformGeneratorsProps {
  content: string
  onPostGenerated?: (platform: Platform, post: string) => void
}

export function PlatformGenerators({ content, onPostGenerated }: PlatformGeneratorsProps) {
  const {
    generatedPosts,
    generateSinglePost,
    regeneratePost,
    isGenerating,
  } = useContentGeneration()

  const platforms = useMemo(() => (
    [
      { key: 'linkedin', name: 'LinkedIn', icon: '💼', variant: 'linkedin' as const },
      { key: 'x', name: 'X', icon: '🐦', variant: 'x' as const },
      { key: 'instagram', name: 'Instagram', icon: '📸', variant: 'instagram' as const },
    ]
  ), [])

  const handleGenerate = async (platform: Platform) => {
    if (!content.trim()) return
    try {
      const post = await generateSinglePost(content, platform)
      onPostGenerated?.(platform, post)
    } catch (error) {
      if (import.meta.env.DEV) console.error(`Generation failed for ${platform}:`, error)
    }
  }

  const handleRegenerate = async (platform: Platform) => {
    try {
      const post = await regeneratePost(content, platform)
      if (post) onPostGenerated?.(platform, post)
    } catch (error) {
      if (import.meta.env.DEV) console.error(`Regeneration failed for ${platform}:`, error)
    }
  }

  if (!content.trim()) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Gib zuerst deinen Newsletter/Blog-Inhalt ein
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Posts generieren</h3>

      <div className="grid gap-4 md:grid-cols-3">
        {platforms.map(({ key, name, icon, variant }) => {
          const k = key as Platform
          const currentPost = generatedPosts[k]
          const hasPost = !!currentPost?.post
          const loading = isGenerating(k)

          return (
            <div key={key} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden>{icon}</span>
                  <span className="font-medium">{name}</span>
                  {currentPost?.regenerationCount ? (
                    <span className="text-xs bg-accent/20 px-2 py-1 rounded">
                      v{currentPost.regenerationCount + 1}
                    </span>
                  ) : null}
                </div>
              </div>

              <Button
                onClick={() => (hasPost ? handleRegenerate(k) : handleGenerate(k))}
                isLoading={loading}
                variant={variant}
                fullWidth
              >
                {hasPost ? '🔄 Regenerieren' : '✨ Generieren'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(PlatformGenerators)
