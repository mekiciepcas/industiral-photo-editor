import { EditClient } from "./EditClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: PageProps) {
  const { id } = await params;
  return <EditClient id={id} />;
}
