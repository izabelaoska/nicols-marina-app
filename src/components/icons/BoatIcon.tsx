export function BoatIcon({
  size = 24,
  color = 'white',
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 13L22 13L20 16L4 16L2 13Z
           M4 10C4 9.44772 4.44772 9 5 9H19
           C19.5523 9 20 9.44772 20 10V11
           H4V10Z
           M8 9V7C8 6.44772 8.44772 6 9 6H15
           C15.5523 6 16 6.44772 16 7V9H8Z"
        fill="currentColor"
      />
    </svg>
  )
}
