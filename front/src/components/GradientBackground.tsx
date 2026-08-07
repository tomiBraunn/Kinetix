import { GradFlow } from 'gradflow'

// Soft pastel palette: periwinkle blue → lavender → blush pink.
// Matches the watercolour wave reference (soft, low-saturation tones).
const KINETIX_GRADIENT = {
  color1: '#7FA8F5',
  color2: '#B79BE8',
  color3: '#F58CB8',
  speed: 0.4,
  scale: 1,
  type: 'stripe' as const,
  noise: 0.06
}

// Full-bleed animated WebGL background. Sits behind the auth card via absolute
// positioning in the parent — content should be `relative z-10` to layer above.
export default function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <GradFlow config={KINETIX_GRADIENT} />
    </div>
  )
}
