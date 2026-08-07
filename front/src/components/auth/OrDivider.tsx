// Hairline rule with a centered "O" separating the form from Google sign-in.
export default function OrDivider() {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-text-label/15" />
      <span className="text-text-placeholder text-sm font-medium">O</span>
      <span className="h-px flex-1 bg-text-label/15" />
    </div>
  )
}
