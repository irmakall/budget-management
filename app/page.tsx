import Link from "next/link";
export default function Home() {
  return (
    <>
      <h1>Para Takip</h1>

      <Link href="/login">Log in</Link>
      <Link href="/signup">Sign up</Link>
    </>
  );
}
