import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { type Platform } from '@/config/platforms'
import { CharacterCounterTextarea } from '@/components/common/CharacterCounter'
import { CopyButton } from '@/components/ui/copy-button'
import {
  SaveButton,
  EditButton,
  LinkedInShareButton,
  XShareButton,
  InstagramShareButton,
} from '@/design-system/components/ActionButtons'
import { toast } from 'sonner'

interface PlatformPreviewCardProps {
  platform: Platform
  content: string
  index?: number
  isEditing?: boolean
  editContent?: string
  onEditContentChange?: (value: string) => void
  onStartEdit?: () => void
  onCancelEdit?: () => void
  onSaveEdit?: () => void
  onSave?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onShare?: () => void
}

const EDITOR_ROWS: Record<Platform, number> = {
  linkedin: 10,
  x: 6,
  instagram: 8,
}

const CARD_STYLES: Record<Platform, { borderClass: string; hoverClass: string; accentStyle: React.CSSProperties }> = {
  linkedin: {
    borderClass: 'border-[#0A66C2]/20',
    hoverClass: 'hover:shadow-[0_12px_30px_rgba(10,102,194,0.12)]',
    accentStyle: { background: '#0A66C2' },
  },
  x: {
    borderClass: 'border-slate-900/10',
    hoverClass: 'hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)]',
    accentStyle: { background: '#111827' },
  },
  instagram: {
    borderClass: 'border-[#F77737]/20',
    hoverClass: 'hover:shadow-[0_12px_30px_rgba(131,58,180,0.16)]',
    accentStyle: { background: 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)' },
  },
}

function MinimalPlatformCard({
  platform,
  content,
  isEditing,
  editContent,
  onEditContentChange,
  actions,
}: {
  platform: Platform
  content: string
  isEditing: boolean
  editContent: string
  onEditContentChange: (value: string) => void
  actions: React.ReactNode
}) {
  const styles = CARD_STYLES[platform]

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200',
        styles.borderClass,
        styles.hoverClass
      )}
      data-post-card
    >
      <div className="h-1 w-full" style={styles.accentStyle} />

      <div className="px-5 py-5">
        {isEditing ? (
          <CharacterCounterTextarea
            value={editContent}
            onChange={onEditContentChange}
            platform={platform}
            rows={EDITOR_ROWS[platform]}
            mode="minimal"
          />
        ) : (
          <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-800">
            {content}
          </p>
        )}
      </div>

      <div className="border-t border-slate-200/80 bg-slate-50/80 px-4 py-3">
        {actions}
      </div>
    </div>
  )
}

export const PlatformPreviewCard = memo(function PlatformPreviewCard({
  platform,
  content,
  isEditing = false,
  editContent = '',
  onEditContentChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onSave,
  onShare,
}: PlatformPreviewCardProps) {
  const editActions = useMemo(() => (
    <div className="flex justify-end gap-2">
      <button
        onClick={onCancelEdit}
        className="px-3 py-1.5 text-sm text-gray-600 transition-colors hover:text-gray-800"
      >
        Abbrechen
      </button>
      <SaveButton
        size="sm"
        onClick={() => onSaveEdit?.()}
        aria-label="Bearbeitete Version speichern"
      />
    </div>
  ), [onCancelEdit, onSaveEdit])

  const viewActions = useMemo(() => (
    <div className="flex items-center justify-end gap-2">
      <CopyButton
        text={content}
        size="icon"
        variant="ghost"
        label="Kopieren"
        onCopy={() => toast.success('Kopiert!')}
      />
      <EditButton
        size="icon"
        onClick={() => onStartEdit?.()}
        text=""
        title="Bearbeiten"
        aria-label="Bearbeiten"
      />
      <SaveButton
        size="icon"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => onSave?.(e)}
        text=""
        title="Speichern"
        aria-label="Speichern"
      />
      {platform === 'linkedin' && (
        <LinkedInShareButton
          size="icon"
          text=""
          onClick={() => onShare?.()}
          title="Auf LinkedIn teilen"
          aria-label="Auf LinkedIn teilen"
        />
      )}
      {platform === 'x' && (
        <XShareButton
          size="icon"
          text=""
          tweetContent={content}
          title="Auf X teilen"
          aria-label="Auf X teilen"
        />
      )}
      {platform === 'instagram' && (
        <InstagramShareButton
          size="icon"
          text=""
          postContent={content}
          title="Auf Instagram teilen"
          aria-label="Auf Instagram teilen"
        />
      )}
    </div>
  ), [content, platform, onStartEdit, onSave, onShare])

  return (
    <MinimalPlatformCard
      platform={platform}
      content={content}
      isEditing={isEditing}
      editContent={editContent}
      onEditContentChange={onEditContentChange || (() => {})}
      actions={isEditing ? editActions : viewActions}
    />
  )
})
