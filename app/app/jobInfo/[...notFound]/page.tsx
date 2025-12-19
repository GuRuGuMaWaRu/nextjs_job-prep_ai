// app/(app)/[...notFound]/page.tsx
import { notFound } from "next/navigation";

export default function AppCatchAll() {
  notFound();
}
