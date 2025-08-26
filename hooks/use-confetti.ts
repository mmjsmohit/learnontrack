import confetti from "canvas-confetti"

export const useConfetti = (particleCount: number, spread: number, origin: { y: number }) => {
  confetti({ particleCount, spread, origin })
}