import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/templates";
import { CaptureClient } from "./CaptureClient";

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function CapturePage({ params }: PageProps) {
  const { type } = await params;
  const template = getTemplate(type);
  if (!template) notFound();
  return <CaptureClient template={template} />;
}
