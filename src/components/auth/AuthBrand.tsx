import Image from "next/image"

export function AuthBrand() {
  return (
    <Image
      src="/birdbot-full-logo-mark2.svg"
      alt="BirdBot"
      width={220}
      height={66}
      priority
      style={{ height: "auto" }}
    />
  )
}
