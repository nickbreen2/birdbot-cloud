import Image from "next/image"
import Link from "next/link"

export function AuthBrand() {
  return (
    <Link href="/">
      <Image
        src="/birdbot-full-logo-mark2.svg"
        alt="BirdBot"
        width={220}
        height={66}
        priority
        style={{ height: "auto" }}
      />
    </Link>
  )
}
