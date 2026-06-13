"use client";

import dynamic from "next/dynamic";

const PegawaiClient = dynamic(() => import("./PegawaiClient"), { ssr: false });

export default function PegawaiPage() {
  return <PegawaiClient />;
}
