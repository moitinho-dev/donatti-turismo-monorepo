import type React from "react"
export function FoodIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8.5 2C8.5 2 8.5 6 8.5 8C8.5 10 7 11 7 11H2C2 11 3.5 10 3.5 8C3.5 6 3.5 2 3.5 2H8.5Z"
        fill="currentColor"
      />
      <path
        d="M19.5 2C19.5 2 19.5 6 19.5 8C19.5 10 18 11 18 11H13C13 11 14.5 10 14.5 8C14.5 6 14.5 2 14.5 2H19.5Z"
        fill="currentColor"
      />
      <path d="M21 22H3C3 22 2 16 2 13H22C22 16 21 22 21 22Z" fill="currentColor" />
    </svg>
  )
}
