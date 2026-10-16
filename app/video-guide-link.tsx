import { ExternalLink, Play } from 'lucide-react';
import type { VideoGuide } from './video-guides';

export function VideoGuideLink({ guide, compact = false }: { guide?: VideoGuide; compact?: boolean }) {
  if (!guide) return null;
  return <div className={`video-guide ${compact ? 'video-guide-compact' : ''}`}>
    <a href={guide.url} target="_blank" rel="noopener noreferrer" className="video-guide-link"
      aria-label={`Katso video-ohje: ${guide.label}. ${guide.channel}. YouTube, avautuu uuteen välilehteen.`}>
      <span className="video-guide-icon"><Play size={compact ? 14 : 18} fill="currentColor"/></span>
      <span className="video-guide-copy"><strong>{compact ? 'Katso video-ohje' : guide.label}</strong><small>{guide.channel} · {guide.language} · YouTube</small></span>
      <ExternalLink size={15} aria-hidden="true"/>
    </a>
    {!compact && guide.note && <p>{guide.note}</p>}
  </div>;
}
